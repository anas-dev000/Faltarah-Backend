// ==========================================
// subscription.jobs.js
// يتم تشغيله بواسطة node-cron
// ==========================================

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import * as subService from "../../modules/subscriptions/subscriptions.service.js";

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
      console.log(`✅ Marked ${result.expiredCount} subscriptions as expired`);
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
      console.log("✅ Expiry alerts sent successfully");
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
 * تشغيل جميع Jobs
 */
export const startSubscriptionJobs = () => {
  console.log("🚀 Starting subscription cron jobs...");

  checkExpiredSubscriptions.start();
  console.log("   ✓ Check Expired Subscriptions: Running daily at 1:00 AM");

  sendExpiryAlerts.start();
  console.log("   ✓ Send Expiry Alerts: Running daily at 9:00 AM");

  console.log("✅ All subscription jobs started successfully");
};

/**
 * Stop all Jobs
 */
export const stopSubscriptionJobs = () => {
  checkExpiredSubscriptions.stop();
  sendExpiryAlerts.stop();
  console.log("🛑 All subscription jobs stopped");
};
