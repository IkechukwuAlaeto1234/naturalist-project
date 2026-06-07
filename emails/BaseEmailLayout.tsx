import * as React from "react";
import { EMAIL_ASSETS } from "./assets";

interface BaseEmailLayoutProps {
  title?: string;
  previewText?: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  logoUrl?: string;
}

export const BaseEmailLayout = ({
  title,
  previewText,
  children,
  unsubscribeUrl = "__UNSUBSCRIBE_URL__",
  logoUrl,
}: BaseEmailLayoutProps) => {
  const defaultLogoUrl = EMAIL_ASSETS.logoTransparent;
  const finalLogoUrl = logoUrl || defaultLogoUrl;
  
  const sansSerifStack = "Verdana, Geneva, sans-serif";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || "Naturalist"}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            background-color: #faf9f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          .email-container {
            max-width: 600px !important;
            width: 100% !important;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              padding: 10px !important;
            }
            .content-card {
              padding: 24px !important;
              border-radius: 16px !important;
            }
            .footer-card {
              padding: 24px 16px !important;
              border-radius: 16px !important;
            }
          }
        `}} />
      </head>
      <body style={{ backgroundColor: "#faf9f5", margin: 0, padding: 0, width: "100%", fontFamily: sansSerifStack }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#faf9f5", tableLayout: "fixed", width: "100%" }}>
          <tr>
            <td align="center" style={{ padding: "40px 10px 40px 10px" }}>
              <table className="email-container" width="600" cellPadding={0} cellSpacing={0} style={{ width: "600px", margin: "0 auto" }}>
                
                {/* 1. Main Content Card */}
                <tr>
                  <td className="content-card" style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "48px 40px", boxShadow: "0 4px 20px rgba(45, 76, 56, 0.02)" }}>
                    
                    {/* Brand Header Logo */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "36px", textAlign: "center" }}>
                      <tr>
                        <td align="center">
                          <img src={finalLogoUrl} alt="Naturalist Logo" style={{ maxHeight: "65px", maxWidth: "220px", display: "block", margin: "0 auto" }} />
                        </td>
                      </tr>
                    </table>

                    {/* Body Content */}
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td style={{ fontFamily: sansSerifStack, fontSize: "14px", color: "#141f19", lineHeight: "1.6" }}>
                          {children}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                {/* Vertical Spacer between cards */}
                <tr>
                  <td style={{ height: "20px", fontSize: "1px", lineHeight: "1px" }}>&nbsp;</td>
                </tr>

                {/* 2. Separate Footer Card */}
                <tr>
                  <td className="footer-card" style={{ backgroundColor: "#fcfbfa", borderRadius: "16px", padding: "32px 24px", textAlign: "center" }}>
                    
                    {/* Footer Socials Pill */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px", textAlign: "center" }}>
                      <tr>
                        <td align="center" dangerouslySetInnerHTML={{ __html: `
<!--[if mso]><table align="center" border="0" cellspacing="0" cellpadding="0" style="width:380px;"><tr><td align="center" bgcolor="#f4efe6" style="padding:12px 28px;border-radius:35px;"><![endif]-->
<table cellpadding="0" cellspacing="0" style="margin:0 auto;background-color:#f4efe6;border-radius:35px;padding:12px 28px">
<tr>
<td style="padding:0 12px;vertical-align:middle"><a href="https://www.facebook.com/naturalist.skincare" target="_blank" style="display:block;text-decoration:none"><img src="${EMAIL_ASSETS.socialFacebook}" alt="Facebook" width="40" height="40" style="width:40px;height:40px;display:block;border:0" /></a></td>
<td style="padding:0 12px;vertical-align:middle"><a href="https://www.instagram.com/naturalist.skincare" target="_blank" style="display:block;text-decoration:none"><img src="${EMAIL_ASSETS.socialInstagram}" alt="Instagram" width="40" height="40" style="width:40px;height:40px;display:block;border:0" /></a></td>
<td style="padding:0 12px;vertical-align:middle"><a href="https://x.com/naturalist_skin" target="_blank" style="display:block;text-decoration:none"><img src="${EMAIL_ASSETS.socialX}" alt="X" width="40" height="40" style="width:40px;height:40px;display:block;border:0" /></a></td>
<td style="padding:0 12px;vertical-align:middle"><a href="https://www.tiktok.com/@naturalist.skincare" target="_blank" style="display:block;text-decoration:none"><img src="${EMAIL_ASSETS.socialTiktok}" alt="TikTok" width="40" height="40" style="width:40px;height:40px;display:block;border:0" /></a></td>
<td style="padding:0 12px;vertical-align:middle"><a href="https://www.youtube.com/@naturalist.skincare" target="_blank" style="display:block;text-decoration:none"><img src="${EMAIL_ASSETS.socialYoutube}" alt="YouTube" width="40" height="40" style="width:40px;height:40px;display:block;border:0" /></a></td>
</tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
        ` }} />
                      </tr>
                    </table>

                    {/* Brand Info & Unsubscribe */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ textAlign: "center" }}>
                      <tr>
                        <td style={{ fontFamily: sansSerifStack, fontSize: "11px", color: "#5e6f64", lineHeight: "1.6" }}>
                          <div style={{ fontWeight: "bold", color: "#2d4c38", marginBottom: "4px" }}>Naturalist Co. Ltd.</div>
                          <div>Inspired by Nature, Crafted for Glow</div>
                          <div style={{ marginTop: "4px" }}>125 Botanical Gardens Drive, Suite 400, SF, CA 94107</div>
                          <div style={{ marginTop: "16px", paddingTop: "16px" }}>
                            This email was sent in response to your account actions. 
                            If you wish to opt-out, please <a href={unsubscribeUrl} style={{ color: "#b07e3a", textDecoration: "underline", fontWeight: "bold" }}>unsubscribe</a>.
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export default BaseEmailLayout;
