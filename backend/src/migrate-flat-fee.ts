/**
 * One-off migration: move existing billing invoices from the old 0.3%-of-
 * revenue fee to the flat monthly subscription.
 *
 *   npm run migrate:flat-fee              (dry run - prints, changes nothing)
 *   npm run migrate:flat-fee -- --apply   (writes)
 *
 * Every invoice is rewritten, settled ones included, so that one price is in
 * force across the whole history. That is deliberate but worth knowing: a paid
 * invoice will afterwards state a different figure from the transfer that
 * settled it, so keep the printed output of this run as the record of what the
 * amounts used to be.
 *
 * Idempotent: an invoice already on the flat fee is left alone.
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import {
  BillingInvoice,
  BillingInvoiceDocument,
} from './schemas/BillingInvoice.model';

const log = new Logger('MigrateFlatFee');

const FEE_AMOUNT = Number(process.env.PLATFORM_FEE_AMOUNT || 79000);
const FEE_CURRENCY = process.env.PLATFORM_FEE_CURRENCY || 'KRW';

async function main() {
  const apply = process.argv.includes('--apply');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const invoiceModel = app.get<Model<BillingInvoiceDocument>>(
      getModelToken(BillingInvoice.name),
    );

    const invoices = await invoiceModel.find().sort({ period: 1 }).exec();
    if (!invoices.length) {
      log.log('No invoices found. Nothing to migrate.');
      return;
    }

    log.log(
      `${apply ? 'Applying' : 'DRY RUN'}: ${invoices.length} invoice(s), ` +
      `new fee ${FEE_AMOUNT} ${FEE_CURRENCY}`,
    );

    let changed = 0;
    for (const inv of invoices) {
      const doc = inv as any;
      if (doc.amountDue === FEE_AMOUNT && doc.currency === FEE_CURRENCY) {
        continue;
      }

      log.log(
        `  ${inv.period}  restaurant ${inv.restaurantId}  ${inv.status}  ` +
        `${doc.amountDue} ${doc.currency} -> ${FEE_AMOUNT} ${FEE_CURRENCY}`,
      );
      changed++;

      if (apply) {
        // The old rate column is dropped; revenue keeps its own currency,
        // which until now was the same column the fee used.
        await invoiceModel.updateOne(
          { _id: inv._id },
          {
            $set: {
              feeAmount: FEE_AMOUNT,
              amountDue: FEE_AMOUNT,
              currency: FEE_CURRENCY,
              revenueCurrency: doc.revenueCurrency || doc.currency || 'KRW',
            },
            $unset: { feeRate: '' },
          },
        );
      }
    }

    if (!changed) {
      log.log('Every invoice is already on the flat fee. Nothing to do.');
    } else if (apply) {
      log.log(`Rewrote ${changed} invoice(s).`);
    } else {
      log.log(
        `${changed} invoice(s) would change. Re-run with --apply to write.`,
      );
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  log.error(err?.message ?? err);
  process.exit(1);
});
