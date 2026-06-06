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
  unsubscribeUrl = "#",
  logoUrl,
}: BaseEmailLayoutProps) => {
  const defaultLogoUrl = EMAIL_ASSETS.logoTransparent;
  const finalLogoUrl = logoUrl || defaultLogoUrl;
  
  const sansSerifStack = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const serifStack = "Georgia, Cambria, 'Times New Roman', Times, serif";

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || "Naturalist"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" type="text/css" />
        {previewText && (
          <span style={{ display: "none", overflow: "hidden", fontSize: "1px", color: "#faf9f5", lineHeight: "1px", maxHeight: "0px", maxWidth: "0px", opacity: 0 }}>
            {previewText}
          </span>
        )}
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
          
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
          }
        `}} />
      </head>
      <body style={{ backgroundColor: "#faf9f5", margin: 0, padding: 0, width: "100%", fontFamily: sansSerifStack }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#faf9f5", tableLayout: "fixed", width: "100%" }}>
          <tr>
            <td align="center" style={{ padding: "40px 10px 40px 10px" }}>
              {/* Container Card */}
              <table className="email-container" width="600" cellPadding={0} cellSpacing={0} style={{ width: "600px", margin: "0 auto" }}>
                <tr>
                  <td className="content-card" style={{ backgroundColor: "#ffffff", border: "1px solid #e2dacd", borderRadius: "24px", padding: "40px 35px", boxShadow: "0 4px 20px rgba(45, 76, 56, 0.02)" }}>
                    
                    {/* Brand Header */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "32px", textAlign: "center" }}>
                      <tr>
                        <td align="center">
                          <img src={finalLogoUrl} alt="Naturalist Logo" style={{ maxHeight: "65px", maxWidth: "220px", display: "block", margin: "0 auto" }} />
                        </td>
                      </tr>
                    </table>

                    {/* Divider */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "30px" }}>
                      <tr>
                        <td style={{ borderTop: "1px solid #f4efe6" }}></td>
                      </tr>
                    </table>

                    {/* Body Content */}
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td style={{ fontFamily: sansSerifStack, fontSize: "15px", color: "#141f19", lineHeight: "1.6" }}>
                          {children}
                        </td>
                      </tr>
                    </table>

                    {/* Divider */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: "30px", marginBottom: "25px" }}>
                      <tr>
                        <td style={{ borderTop: "1px solid #f4efe6" }}></td>
                      </tr>
                    </table>

                    {/* Footer Socials */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px", textAlign: "center" }}>
                      <tr>
                        <td align="center">
                          <span dangerouslySetInnerHTML={{ __html: "<!--[if mso]><table align=\"center\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:250px;\"><tr><td align=\"center\" bgcolor=\"#f4efe6\" style=\"padding:10px 24px;border-radius:30px;\"><![endif]-->" }} />
                          <table cellPadding={0} cellSpacing={0} style={{ margin: "0 auto", backgroundColor: "#f4efe6", borderRadius: "30px", padding: "10px 24px" }}>
                            <tr>
                              <td style={{ padding: "0 10px", verticalAlign: "middle" }}>
                                <a href="https://www.facebook.com/naturalist.skincare" target="_blank" style={{ display: "block", textDecoration: "none" }}>
                                  <img src={EMAIL_ASSETS.socialFacebook} alt="Facebook" width="24" height="24" style={{ width: "24px", height: "24px", display: "block", border: 0 }} />
                                </a>
                              </td>
                              <td style={{ padding: "0 10px", verticalAlign: "middle" }}>
                                <a href="https://www.instagram.com/naturalist.skincare" target="_blank" style={{ display: "block", textDecoration: "none" }}>
                                  <img src={EMAIL_ASSETS.socialInstagram} alt="Instagram" width="24" height="24" style={{ width: "24px", height: "24px", display: "block", border: 0 }} />
                                </a>
                              </td>
                              <td style={{ padding: "0 10px", verticalAlign: "middle" }}>
                                <a href="https://x.com/naturalist_skin" target="_blank" style={{ display: "block", textDecoration: "none" }}>
                                  <img src={EMAIL_ASSETS.socialX} alt="X" width="24" height="24" style={{ width: "24px", height: "24px", display: "block", border: 0 }} />
                                </a>
                              </td>
                              <td style={{ padding: "0 10px", verticalAlign: "middle" }}>
                                <a href="https://www.tiktok.com/@naturalist.skincare" target="_blank" style={{ display: "block", textDecoration: "none" }}>
                                  <img src={EMAIL_ASSETS.socialTiktok} alt="TikTok" width="24" height="24" style={{ width: "24px", height: "24px", display: "block", border: 0 }} />
                                </a>
                              </td>
                              <td style={{ padding: "0 10px", verticalAlign: "middle" }}>
                                <a href="https://www.youtube.com/@naturalist.skincare" target="_blank" style={{ display: "block", textDecoration: "none" }}>
                                  <img src={EMAIL_ASSETS.socialYoutube} alt="YouTube" width="24" height="24" style={{ width: "24px", height: "24px", display: "block", border: 0 }} />
                                </a>
                              </td>
                            </tr>
                          </table>
                          <span dangerouslySetInnerHTML={{ __html: "<!--[if mso]></td></tr></table><![endif]-->" }} />
                        </td>
                      </tr>
                    </table>

                    {/* Footer Info & Unsubscribe */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ textAlign: "center" }}>
                      <tr>
                        <td style={{ fontFamily: sansSerifStack, fontSize: "11px", color: "#5e6f64", lineHeight: "1.6" }}>
                          <div style={{ fontWeight: "bold", color: "#2d4c38", marginBottom: "4px" }}>Naturalist Co. Ltd.</div>
                          <div>Inspired by Nature, Crafted for Glow</div>
                          <div style={{ marginTop: "4px" }}>125 Botanical Gardens Drive, Suite 400, SF, CA 94107</div>
                          <div style={{ marginTop: "12px", borderTop: "1px solid #faf9f5", paddingTop: "12px" }}>
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
