// ==========================================
// subscription.jobs.js
// يتم تشغيله بواسطة node-cron
// ==========================================

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import * as subService from "../../modules/subscriptions/subscriptions.service.js";
import {
  sendDiscountOfferEmail,
  sendFinalWarningEmail,
} from "../../shared/utils/email.service.js";

const prisma = new PrismaClient();

/**
 * Job: التحقق من الاشتراكات المنتهية
 * يعمل كل يوم في الساعة 1:00 صباحاً
 */
export const checkExpiredSubscriptions = cron.schedule(
  "0 1 * * *",
  async () => {
    console.log("🔍 Running: Check Expired Subscriptions Job");

    try {
      const result = await subService.markExpiredSubscriptions(prisma);
      console.log(` Marked ${result.expiredCount} subscriptions as expired`);
    } catch (error) {
      console.error("❌ Error in checkExpiredSubscriptions job:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Cairo",
  }
);

/**
 * Job: إرسال تنبيهات قرب انتهاء الاشتراك
 * يعمل كل يوم في الساعة 9:00 صباحاً
 */
export const sendExpiryAlerts = cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("📧 Running: Send Expiry Alerts Job");

    try {
      await subService.checkAndSendExpiryAlerts(prisma);
      console.log(" Expiry alerts sent successfully");
    } catch (error) {
      console.error("❌ Error in sendExpiryAlerts job:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Cairo",
  }
);

/**
 * ✨ NEW Job 3: إرسال عرض خصم 25% (بعد 20 يوم من التسجيل)
 * يعمل كل يوم في الساعة 10:00 صباحاً
 */
export const sendDiscountOffers = cron.schedule(
  "0 10 * * *",
  async () => {
    console.log("🎁 Running: Send Discount Offers Job");

    try {
      const now = new Date();
      const twentyDaysAgo = new Date(now);
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      // شركات انتهت فترتها التجريبية ولم تشترك
      const expiredTrialCompanies = await prisma.company.findMany({
        where: {
          createdAt: {
            lte: tenDaysAgo, // مرت على الأقل 10 أيام
            gte: twentyDaysAgo, // لم تمر 20 يوم بعد
          },
          subscriptions: {
            none: {
              paymentStatus: "paid",
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      console.log(
        `📊 Found ${expiredTrialCompanies.length} companies eligible for discount offer`
      );

      for (const company of expiredTrialCompanies) {
        const daysSinceCreation = Math.floor(
          (now - new Date(company.createdAt)) / (1000 * 60 * 60 * 24)
        );

        // بعد 10 أيام من انتهاء التجربة (20 يوم من التسجيل)
        if (daysSinceCreation === 20 && company.email) {
          await sendDiscountOfferEmail(company.email, company.name);
          console.log(` Sent discount offer to: ${company.name}`);
        }

        // تذكير يومي خلال الـ 5 أيام الأخيرة
        if (
          daysSinceCreation >= 20 &&
          daysSinceCreation < 25 &&
          company.email
        ) {
          const daysLeft = 25 - daysSinceCreation;
          await sendFinalWarningEmail(company.email, company.name, daysLeft);
          console.log(
            `⚠️ Sent final warning (${daysLeft} days left) to: ${company.name}`
          );
        }
      }

      console.log(" Discount offers sent successfully");
    } catch (error) {
      console.error("❌ Error in sendDiscountOffers job:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Cairo",
  }
);

/**
 * ✨ NEW Job 4: حذف الشركات غير المشتركة (بعد 25 يوم)
 * يعمل كل يوم في الساعة 2:00 صباحاً
 */
export const deleteExpiredTrialCompanies = cron.schedule(
  "0 2 * * *",
  async () => {
    console.log("🗑️ Running: Delete Expired Trial Companies Job");

    try {
      const now = new Date();
      const twentyFiveDaysAgo = new Date(now);
      twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);

      // شركات مرت عليها 25 يوم ولم تشترك
      const companiesToDelete = await prisma.company.findMany({
        where: {
          createdAt: {
            lte: twentyFiveDaysAgo,
          },
          subscriptions: {
            none: {
              status: "active",
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      console.log(`📊 Found ${companiesToDelete.length} companies to delete`);

      for (const company of companiesToDelete) {
        try {
          // حذف الشركة بالكامل
          await prisma.$transaction(async (tx) => {
            // حذف كل البيانات المرتبطة
            await tx.invoiceItem.deleteMany({
              where: { companyId: company.id },
            });

            const invoices = await tx.invoice.findMany({
              where: { companyId: company.id },
              select: { id: true },
            });
            const invoiceIds = invoices.map((inv) => inv.id);

            if (invoiceIds.length > 0) {
              const installments = await tx.installment.findMany({
                where: { invoiceId: { in: invoiceIds } },
                select: { id: true },
              });
              const installmentIds = installments.map((inst) => inst.id);

              if (installmentIds.length > 0) {
                await tx.installmentPayment.deleteMany({
                  where: { installmentId: { in: installmentIds } },
                });
              }

              await tx.installment.deleteMany({
                where: { invoiceId: { in: invoiceIds } },
              });
            }

            await tx.invoice.deleteMany({ where: { companyId: company.id } });
            await tx.maintenance.deleteMany({
              where: { companyId: company.id },
            });
            await tx.customerMaintenanceStatus.deleteMany({
              where: { companyId: company.id },
            });

            const products = await tx.product.findMany({
              where: { companyId: company.id },
              select: { id: true },
            });
            const productIds = products.map((p) => p.id);

            if (productIds.length > 0) {
              await tx.productAccessory.deleteMany({
                where: { productId: { in: productIds } },
              });
            }

            await tx.product.deleteMany({ where: { companyId: company.id } });
            await tx.accessory.deleteMany({ where: { companyId: company.id } });
            await tx.service.deleteMany({ where: { companyId: company.id } });
            await tx.supplier.deleteMany({ where: { companyId: company.id } });
            await tx.employee.deleteMany({ where: { companyId: company.id } });
            await tx.customer.deleteMany({ where: { companyId: company.id } });
            await tx.user.deleteMany({ where: { companyId: company.id } });
            await tx.subscriptionInvoice.deleteMany({
              where: { companyId: company.id },
            });

            const subscriptions = await tx.subscription.findMany({
              where: { companyId: company.id },
              select: { id: true },
            });

            if (subscriptions.length > 0) {
              await tx.subscriptionAlert.deleteMany({
                where: {
                  subscriptionId: { in: subscriptions.map((s) => s.id) },
                },
              });
            }

            await tx.subscription.deleteMany({
              where: { companyId: company.id },
            });

            // حذف الشركة نفسها
            await tx.company.delete({
              where: { id: company.id },
            });
          });

          console.log(
            `🗑️ Deleted company: ${company.name} (ID: ${company.id})`
          );
        } catch (error) {
          console.error(`❌ Error deleting company ${company.name}:`, error);
        }
      }

      console.log(
        ` Deleted ${companiesToDelete.length} expired trial companies`
      );
    } catch (error) {
      console.error("❌ Error in deleteExpiredTrialCompanies job:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Cairo",
  }
);

/**
 * تشغيل جميع Jobs
 */
export const startSubscriptionJobs = () => {
  console.log("🚀 Starting subscription cron jobs...");

  checkExpiredSubscriptions.start();
  console.log("   ✓ Check Expired Subscriptions: Running daily at 1:00 AM");

  sendExpiryAlerts.start();
  console.log("   ✓ Send Expiry Alerts: Running daily at 9:00 AM");

  sendDiscountOffers.start();
  console.log("   ✓ Send Discount Offers: Running daily at 10:00 AM");

  deleteExpiredTrialCompanies.start();
  console.log("   ✓ Delete Expired Trial Companies: Running daily at 2:00 AM");

  console.log(" All subscription jobs started successfully");
};

/**
 * Stop all Jobs
 */
export const stopSubscriptionJobs = () => {
  checkExpiredSubscriptions.stop();
  sendExpiryAlerts.stop();
  sendDiscountOffers.stop();
  deleteExpiredTrialCompanies.stop();
  console.log("🛑 All subscription jobs stopped");
};
