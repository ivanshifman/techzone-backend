export const mailTemplates = {
  verifyMail: (customerName: string, customerEmail: string, otp: string) => `
          <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
          }
  
          .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              overflow: hidden;
          }
  
          .email-header {
              background-color: #4caf50;
              color: #ffffff;
              text-align: center;
              padding: 20px;
          }
  
          .email-header h1 {
              margin: 0;
              font-size: 24px;
          }
  
          .email-body {
              padding: 20px;
              color: #333333;
          }
  
          .email-body p {
              margin: 15px 0;
              line-height: 1.5;
          }
  
          .otp {
              display: inline-block;
              background-color: #4caf50;
              color: #ffffff;
              padding: 10px 20px;
              font-size: 20px;
              border-radius: 4px;
              margin: 20px 0;
              text-align: center;
          }
  
          .email-footer {
              background-color: #f4f4f9;
              text-align: center;
              padding: 15px;
              font-size: 12px;
              color: #888888;
          }
  
          .email-footer a {
              color: #4caf50;
              text-decoration: none;
          }
  
          @media (max-width: 600px) {
              .email-container {
                  margin: 10px;
              }
  
              .email-body {
                  padding: 15px;
              }
  
              .otp {
                  font-size: 18px;
                  padding: 8px 16px;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="email-header">
              <h1>Verification Code</h1>
          </div>
          <div class="email-body">
              <p>Dear <strong>${customerName}</strong>,</p>
              <p>Thank you for using our services! Your one-time password (OTP) is:</p>
              <div class="otp">${otp}</div>
              <p>Please use this code to complete your verification. If you did not request this code, please ignore this email.</p>
              <p>This email was sent to: <strong>${customerEmail}</strong></p>
          </div>
          <div class="email-footer">
              <p>If you have any questions, feel free to contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
              <p>&copy; 2025 Your Company Name. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
        `,
  forgotPassword: (
    customerName: string,
    customerEmail: string,
    newPassword: string,
    loginUrl: string,
  ) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    margin: 0;
                    padding: 0;
                }
    
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
    
                .email-header {
                    background-color: #007bff;
                    color: #ffffff;
                    text-align: center;
                    padding: 20px;
                }
    
                .email-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
    
                .email-body {
                    padding: 20px;
                    color: #333333;
                }
    
                .email-body p {
                    margin: 15px 0;
                    line-height: 1.5;
                }
    
                .email-body a {
                    display: inline-block;
                    background-color: #007bff;
                    color: #ffffff;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
    
                .email-footer {
                    background-color: #f4f4f9;
                    text-align: center;
                    padding: 15px;
                    font-size: 12px;
                    color: #888888;
                }
    
                .email-footer a {
                    color: #007bff;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>Password Reset</h1>
                </div>
                <div class="email-body">
                    <p>Dear <strong>${customerName}</strong>,</p>
                    <p>Your password has been reset successfully. Please use the following password to log in:</p>
                    <p style="font-weight: bold;">${newPassword}</p>
                    <p>You can log in using the following link:</p>
                    <a href="${loginUrl}" target="_blank">Log In</a>
                    <p>If you did not request a password reset, please contact support immediately.</p>
                    <p>This email was sent to: <strong>${customerEmail}</strong></p>
                </div>
                <div class="email-footer">
                    <p>If you have any questions, feel free to contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
                    <p>&copy; 2025 Your Company Name. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
};
