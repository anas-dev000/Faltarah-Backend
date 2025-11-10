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
