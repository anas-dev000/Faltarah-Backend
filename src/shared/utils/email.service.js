import nodemailer from "nodemailer";
import { config } from "../../config/env.js";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const sendOTPEmail = async (email, otp, fullName) => {
  const mailOptions = {
    from: `"نظام فلترة - Faltarah" <${config.email.user}>`,
    to: email,
    subject: "تفعيل حسابك - رمز التحقق OTP",
    html: `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; font-family: monospace; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          .warning { background: #fff3cd; border-right: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">فلترة - Faltarah</div>
            <h1 style="margin: 10px 0;">تفعيل الحساب</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${fullName}،</h2>
            <p>شكراً لتسجيلك في نظام فلترة! يرجى استخدام رمز التحقق التالي لتفعيل حسابك:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">رمز التحقق الخاص بك</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">صالح لمدة 10 دقائق</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ تنبيه أمني:</strong> لا تشارك هذا الرمز مع أي شخص. فريقنا لن يطلب منك أبداً رمز التحقق.
            </div>
            
            <p style="color: #6c757d;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.</p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>فلترة - Faltarah</strong></p>
            <p style="margin: 5px 0;">نظام إدارة شامل للشركات</p>
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, resetToken, fullName) => {
  const resetLink = `${config.frontend.url}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"نظام فلترة - Faltarah" <${config.email.user}>`,
    to: email,
    subject: "إعادة تعيين كلمة المرور",
    html: `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          .warning { background: #fff3cd; border-right: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">فلترة - Faltarah</div>
            <h1 style="margin: 10px 0;">إعادة تعيين كلمة المرور</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${fullName}،</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه للمتابعة:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ تنبيه أمني:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.
            </div>
            
            <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
              إذا لم يعمل الزر، انسخ والصق هذا الرابط في متصفحك:<br>
              <span style="direction: ltr; display: inline-block; margin-top: 10px;">${resetLink}</span>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>فلترة - Faltarah</strong></p>
            <p style="margin: 5px 0;">نظام إدارة شامل للشركات</p>
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendAdminNotificationEmail = async (signupData) => {
  const mailOptions = {
    from: `"نظام فلترة - Faltarah" <${config.email.user}>`,
    to: "khedmaanas24247893@gmail.com",
    subject: "🎉 تسجيل شركة جديدة - فلترة",
    html: `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .info-table td:first-child { font-weight: bold; color: #374151; width: 40%; background: #f9fafb; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">فلترة - Faltarah</div>
            <h1 style="margin: 10px 0;">🎉 تسجيل شركة جديدة</h1>
            <span class="badge">تنبيه إداري</span>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">تم تسجيل شركة جديدة في نظام فلترة:</p>
            
            <table class="info-table">
              <tr>
                <td>اسم الشركة</td>
                <td><strong>${signupData.companyName}</strong></td>
              </tr>
              <tr>
                <td>اسم المسؤول</td>
                <td>${signupData.fullName}</td>
              </tr>
              <tr>
                <td>البريد الإلكتروني</td>
                <td style="direction: ltr; text-align: right;">${
                  signupData.email
                }</td>
              </tr>
              <tr>
                <td>رقم الهاتف</td>
                <td style="direction: ltr; text-align: right;">${
                  signupData.phone || "غير محدد"
                }</td>
              </tr>
              <tr>
                <td>العنوان</td>
                <td>${signupData.address || "غير محدد"}</td>
              </tr>
              <tr>
                <td>تاريخ التسجيل</td>
                <td>${new Date().toLocaleString("ar-EG", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}</td>
              </tr>
              <tr>
                <td>تاريخ انتهاء التجربة</td>
                <td>${new Date(
                  signupData.subscriptionExpiryDate
                ).toLocaleString("ar-EG", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}</td>
              </tr>
            </table>
            
            <div style="background: #e0f2fe; border-right: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <strong>📝 ملاحظة:</strong> الشركة لديها فترة تجريبية مدتها 10 أيام للوصول الكامل إلى جميع ميزات النظام.
            </div>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>فلترة - Faltarah</strong></p>
            <p style="margin: 5px 0;">نظام إدارة شامل للشركات</p>
            <p style="margin: 5px 0;">هذا إشعار تلقائي من نظام فلترة</p>
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, fullName, companyName) => {
  // حساب تاريخ انتهاء التجربة (10 أيام من الآن)
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 10);
  const formattedTrialEnd = trialEndDate.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"نظام فلترة - Faltarah" <${config.email.user}>`,
    to: email,
    subject: "🎉 مرحباً بك في نظام فلترة!",
    html: `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          .feature { background: #f0fdf4; padding: 15px; margin: 10px 0; border-radius: 5px; border-right: 3px solid #10b981; }
          .trial-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">فلترة - Faltarah</div>
            <h1 style="margin: 10px 0;">🎉 مرحباً بك!</h1>
          </div>
          <div class="content">
            <h2>عزيزي ${fullName}،</h2>
            <p style="font-size: 16px;">مرحباً بك في نظام فلترة! تم تسجيل شركة <strong>${companyName}</strong> بنجاح.</p>
            
            <div class="trial-box">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">⭐ فترة تجريبية مجانية</h3>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">10 أيام وصول كامل لجميع الميزات</p>
              <p style="margin: 10px 0 0 0; color: #92400e;">تنتهي في: <strong>${formattedTrialEnd}</strong></p>
            </div>
            
            <h3 style="color: #374151; margin-top: 30px;">ماذا يمكنك فعله الآن:</h3>
            
            <div class="feature">
              <strong>✅ إدارة المستخدمين</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">أضف وأدر المستخدمين والصلاحيات</p>
            </div>
            
            <div class="feature">
              <strong>✅ إدارة المنتجات والإكسسوارات</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">سجل وتتبع جميع المنتجات والمخزون</p>
            </div>
            
            <div class="feature">
              <strong>✅ نظام الفواتير الشامل</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">إصدار وإدارة الفواتير بسهولة</p>
            </div>
            
            <div class="feature">
              <strong>✅ تقارير وإحصائيات</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">تقارير تفصيلية في الوقت الفعلي</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                config.frontend.url
              }/login" class="button">ابدأ الاستخدام الآن</a>
            </div>
            
            <div style="background: #eff6ff; border-right: 4px solid #3b82f6; padding: 15px; margin: 30px 0; border-radius: 5px;">
              <strong>💡 نصيحة:</strong> ابدأ بإضافة معلومات شركتك وإعداد المستخدمين الأساسيين أولاً.
            </div>
            
            <p style="color: #6c757d; margin-top: 30px; text-align: center;">
              <strong>تحتاج مساعدة؟</strong><br>
              فريق الدعم جاهز لمساعدتك في أي وقت
            </p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>فلترة - Faltarah</strong></p>
            <p style="margin: 5px 0;">نظام إدارة شامل للشركات</p>
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * إرسال بريد تأكيد الاشتراك
 */ 
export const sendSubscriptionConfirmationEmail = async (
  email,
  companyName,
  planName,
  startDate,
  endDate
) => {
  const formattedStartDate = new Date(startDate).toLocaleDateString("ar-EG");
  const formattedEndDate = new Date(endDate).toLocaleDateString("ar-EG");

  const mailOptions = {
    from: `"فلترة - نظام إدارة الفلاتر" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "تأكيد تفعيل الاشتراك ✅",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: right;
          }
          .success-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
          }
          .info-box {
            background: #f8f9fa;
            border-right: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .info-box p {
            margin: 10px 0;
            color: #333;
          }
          .info-box strong {
            color: #667eea;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 تم تفعيل اشتراكك بنجاح!</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            
            <p>مرحباً <strong>${companyName}</strong>،</p>
            
            <p>نحن سعداء بإبلاغك أنه تم تفعيل اشتراكك في نظام فلترة بنجاح!</p>
            
            <div class="info-box">
              <p><strong>الباقة:</strong> ${planName}</p>
              <p><strong>تاريخ البدء:</strong> ${formattedStartDate}</p>
              <p><strong>تاريخ الانتهاء:</strong> ${formattedEndDate}</p>
            </div>
            
            <p>يمكنك الآن الاستمتاع بجميع مميزات النظام بدون أي قيود.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                الذهاب إلى لوحة التحكم
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 فلترة - نظام إدارة الفلاتر والتكييفات</p>
            <p>هذا البريد الإلكتروني مُرسل تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Subscription confirmation email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending subscription confirmation email:", error);
    throw error;
  }
};

/**
 * إرسال تحذير قرب انتهاء الاشتراك
 */
export const sendSubscriptionExpiryWarningEmail = async (
  email,
  companyName,
  expiryDate,
  daysRemaining
) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString("ar-EG");

  const mailOptions = {
    from: `"فلترة - نظام إدارة الفلاتر" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `⚠️ تنبيه: اشتراكك ينتهي خلال ${daysRemaining} ${
      daysRemaining === 1 ? "يوم" : "أيام"
    }`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: right;
          }
          .warning-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
          }
          .warning-box {
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .warning-box h3 {
            margin-top: 0;
            color: #856404;
          }
          .warning-box p {
            color: #856404;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ تنبيه انتهاء الاشتراك</h1>
          </div>
          <div class="content">
            <div class="warning-icon">⏰</div>
            
            <p>عزيزي <strong>${companyName}</strong>،</p>
            
            <div class="warning-box">
              <h3>اشتراكك على وشك الانتهاء!</h3>
              <p><strong>المتبقي:</strong> ${daysRemaining} ${
      daysRemaining === 1 ? "يوم واحد" : "أيام"
    }</p>
              <p><strong>تاريخ الانتهاء:</strong> ${formattedDate}</p>
            </div>
            
            <p>لتجنب انقطاع الخدمة، يرجى تجديد اشتراكك في أقرب وقت ممكن.</p>
            
            <p><strong>ماذا سيحدث بعد انتهاء الاشتراك؟</strong></p>
            <ul style="text-align: right; color: #666;">
              <li>لن تتمكن من الوصول إلى النظام</li>
              <li>سيتم إيقاف جميع الخدمات مؤقتاً</li>
              <li>ستفقد الوصول إلى التقارير والفواتير</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/subscription" class="button">
                تجديد الاشتراك الآن
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 فلترة - نظام إدارة الفلاتر والتكييفات</p>
            <p>للاستفسارات: ${
              process.env.SUPPORT_EMAIL || "support@faltarah.com"
            }</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Expiry warning email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending expiry warning email:", error);
    throw error;
  }
};

/**
 * إرسال بريد انتهاء الاشتراك
 */
export const sendSubscriptionExpiredEmail = async (email, companyName) => {
  const mailOptions = {
    from: `"فلترة - نظام إدارة الفلاتر" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "🔴 انتهى اشتراكك - يرجى التجديد",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: right;
          }
          .expired-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
          }
          .expired-box {
            background: #f8d7da;
            border-right: 4px solid #dc3545;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .expired-box h3 {
            margin-top: 0;
            color: #721c24;
          }
          .expired-box p {
            color: #721c24;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔴 انتهى اشتراكك</h1>
          </div>
          <div class="content">
            <div class="expired-icon">⛔</div>
            
            <p>عزيزي <strong>${companyName}</strong>،</p>
            
            <div class="expired-box">
              <h3>انتهى اشتراكك في نظام فلترة</h3>
              <p>تم إيقاف وصولك إلى النظام مؤقتاً حتى يتم تجديد الاشتراك.</p>
            </div>
            
            <p><strong>لاستعادة الوصول:</strong></p>
            <ol style="text-align: right; color: #666;">
              <li>قم بزيارة صفحة الاشتراكات</li>
              <li>اختر الباقة المناسبة لك</li>
              <li>أكمل عملية الدفع</li>
              <li>سيتم تفعيل حسابك فوراً</li>
            </ol>
            
            <p style="background: #e7f3ff; padding: 15px; border-radius: 5px; color: #004085;">
              💡 <strong>نصيحة:</strong> الباقات السنوية توفر لك حتى 25% من التكلفة!
            </p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/subscription" class="button">
                تجديد الاشتراك الآن
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              نحن هنا لمساعدتك! تواصل معنا إذا كان لديك أي استفسار.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 فلترة - نظام إدارة الفلاتر والتكييفات</p>
            <p>الدعم الفني: ${
              process.env.SUPPORT_EMAIL || "support@faltarah.com"
            } | ${process.env.SUPPORT_PHONE || "01XXXXXXXXX"}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Subscription expired email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending subscription expired email:", error);
    throw error;
  }
};



/**
 * إرسال إيميل عرض خصم 25% (بعد 20 يوم من التسجيل)
 */
export const sendDiscountOfferEmail = async (email, companyName) => {
  const mailOptions = {
    from: `"فلترة - نظام إدارة الفلاتر" <${config.email.from}>`,
    to: email,
    subject: "🎁 عرض خاص! خصم 25% على جميع الباقات",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
            text-align: right;
          }
          .offer-icon {
            text-align: center;
            font-size: 80px;
            margin: 20px 0;
          }
          .discount-box {
            background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
            border: 3px dashed #e17055;
            padding: 30px;
            margin: 30px 0;
            border-radius: 10px;
            text-align: center;
          }
          .discount-box h2 {
            margin: 0;
            font-size: 48px;
            color: #d63031;
          }
          .discount-box p {
            margin: 10px 0 0 0;
            font-size: 20px;
            color: #2d3436;
            font-weight: bold;
          }
          .price-comparison {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 20px 0;
          }
          .old-price {
            font-size: 32px;
            color: #b2bec3;
            text-decoration: line-through;
          }
          .new-price {
            font-size: 42px;
            color: #00b894;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
            color: white;
            padding: 18px 50px;
            text-decoration: none;
            border-radius: 50px;
            margin: 30px 0;
            font-weight: bold;
            font-size: 20px;
            box-shadow: 0 10px 20px rgba(0, 184, 148, 0.3);
          }
          .warning-box {
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 20px;
            margin: 30px 0;
            border-radius: 5px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 عرض خاص لك!</h1>
          </div>
          <div class="content">
            <div class="offer-icon">🎉</div>
            
            <p>عزيزي <strong>${companyName}</strong>،</p>
            
            <p style="font-size: 18px;">لاحظنا أنك لم تكمل الاشتراك بعد انتهاء الفترة التجريبية!</p>
            
            <div class="discount-box">
              <h2>خصم 25%</h2>
              <p>على جميع الباقات السنوية</p>
            </div>
            
            <p style="text-align: center; font-size: 18px; margin: 30px 0;">
              <strong>مثال: الباقة السنوية</strong>
            </p>
            
            <div class="price-comparison">
              <div class="old-price">2,691 جنيه</div>
              <div style="font-size: 30px;">→</div>
              <div class="new-price">2,018 جنيه</div>
            </div>
            
            <p style="text-align: center; color: #00b894; font-weight: bold; font-size: 20px;">
              وفر 673 جنيه! 💰
            </p>
            
            <div style="text-align: center;">
              <a href="${config.frontend.url}/subscription?discount=25" class="button">
                احصل على الخصم الآن
              </a>
            </div>
            
            <div class="warning-box">
              <p style="margin: 0; color: #856404;">
                <strong>⏰ تحذير:</strong> 
                هذا العرض متاح لمدة <strong>5 أيام فقط</strong>!<br>
                بعد ذلك سيتم حذف جميع بياناتك نهائياً.
              </p>
            </div>
            
            <p style="background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 30px 0;">
              💡 <strong>لماذا تختار فلترة؟</strong><br>
              • إدارة شاملة للعملاء والفواتير<br>
              • نظام أقساط ذكي<br>
              • تقارير تفصيلية في الوقت الفعلي<br>
              • دعم فني متواصل
            </p>
          </div>
          <div class="footer">
            <p>© 2025 فلترة - نظام إدارة الفلاتر والتكييفات</p>
            <p>الدعم الفني: ${config.email.supportEmail} | ${config.email.supportPhone}</p>
            <p style="margin-top: 15px; color: #999;">
              هذا عرض محدود لمدة 5 أيام فقط
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Discount offer email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending discount email:', error);
    throw error;
  }
};

/**
 * إرسال إيميل تحذير أخير قبل الحذف (بعد 20 يوم)
 */
export const sendFinalWarningEmail = async (email, companyName, daysLeft) => {
  const mailOptions = {
    from: `"فلترة - نظام إدارة الفلاتر" <${config.email.from}>`,
    to: email,
    subject: `⚠️ تحذير نهائي: ${daysLeft} أيام حتى حذف بياناتك!`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #d63031 0%, #e17055 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
            text-align: right;
          }
          .warning-icon {
            text-align: center;
            font-size: 100px;
            margin: 20px 0;
          }
          .countdown {
            background: #ffe0e0;
            border: 4px solid #d63031;
            padding: 30px;
            margin: 30px 0;
            border-radius: 10px;
            text-align: center;
          }
          .countdown h2 {
            margin: 0;
            font-size: 60px;
            color: #d63031;
          }
          .button {
            display: inline-block;
            background: #00b894;
            color: white;
            padding: 18px 50px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ تحذير نهائي!</h1>
          </div>
          <div class="content">
            <div class="warning-icon">🚨</div>
            
            <p style="font-size: 20px;">عزيزي <strong>${companyName}</strong>،</p>
            
            <div class="countdown">
              <h2>${daysLeft}</h2>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #2d3436;">
                ${daysLeft === 1 ? 'يوم واحد' : 'أيام'} حتى حذف بياناتك نهائياً!
              </p>
            </div>
            
            <p style="font-size: 18px; color: #d63031; font-weight: bold;">
              سيتم حذف جميع بياناتك بشكل نهائي ولا يمكن استرجاعها!
            </p>
            
            <p style="background: #ffeaa7; padding: 20px; border-radius: 5px; margin: 30px 0; text-align: center;">
              <strong style="font-size: 24px; color: #d63031;">خصم 25%</strong><br>
              <span style="font-size: 18px;">لا يزال العرض متاحاً!</span>
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${config.frontend.url}/subscription?discount=25" class="button">
                احفظ بياناتك الآن!
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Final warning email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending final warning:', error);
    throw error;
  }
};