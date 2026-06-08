let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// For local testing, since public email clients (like Gmail) cannot access localhost,
// we serve email images using the live production CDN domain.
if (appUrl.includes("localhost")) {
  appUrl = "https://naturalist-project.onrender.com";
}

export const EMAIL_ASSETS = {
  // Headers
  verifyEmailHeader: `${appUrl}/cdn/image/upload/v1780787282/brand/verify_email_header.png`,
  resetPasswordHeader: `${appUrl}/cdn/image/upload/v1780787283/brand/reset_password_header.png`,
  welcomeHeader: `${appUrl}/cdn/image/upload/v1780787284/brand/welcome_header.png`,
  confirmOrderHeader: `${appUrl}/cdn/image/upload/v1780787285/brand/confirm_order_header.png`,
  orderShippedHeader: `${appUrl}/cdn/image/upload/v1780787287/brand/order_shipped_header.png`,
  passwordSuccessHeader: `${appUrl}/cdn/image/upload/v1780787288/brand/password_success_header.png`,
  securityAlertHeader: `${appUrl}/cdn/image/upload/v1780787289/brand/security_alert_header.png`,
  legalUpdateHeader: `${appUrl}/cdn/image/upload/v1780787290/brand/legal_update_header.png`,

  // Social Icons
  socialInstagram: `${appUrl}/cdn/image/upload/v1780787291/brand/social_instagram.png?v=3`,
  socialX: `${appUrl}/cdn/image/upload/v1780787292/brand/social_x.png?v=3`,
  socialLinkedin: `${appUrl}/cdn/image/upload/v1780787294/brand/social_linkedin.png?v=3`,
  socialYoutube: `${appUrl}/cdn/image/upload/v1780787295/brand/social_youtube.png?v=3`,
  socialFacebook: `${appUrl}/cdn/image/upload/v1780787296/brand/social_facebook.png?v=3`,
  socialTiktok: `${appUrl}/cdn/image/upload/v1780787298/brand/social_tiktok.png?v=3`,
  socialWhatsapp: `${appUrl}/cdn/image/upload/v1780787299/brand/social_whatsapp.png?v=3`,

  // Illustrations
  colorfulBlobs: `${appUrl}/cdn/image/upload/v1780787300/email/colorful_blobs.jpg`,
  earthToneFlat: `${appUrl}/cdn/image/upload/v1780787301/email/earth_tone_flat_vector_illustration.jpg`,
  packageShipping: `${appUrl}/cdn/image/upload/v1780787302/email/illustration_of_package_shipping_tracking.jpg`,
  piratageLastPass: `${appUrl}/cdn/image/upload/v1780787303/email/piratage_de_lastpass___quand_les_gestionnaires_de_.jpg`,
  plantGifts: `${appUrl}/cdn/image/upload/v1780787304/email/plant_gifts_for_delivery___plant_gift_baskets___18.jpg`,
  taskManagement: `${appUrl}/cdn/image/upload/v1780787305/email/task_management_and_planner_organizing_illustratio.jpg`,
  webIllustrations: `${appUrl}/cdn/image/upload/v1780787306/email/web_illustrations_-_alex_kulieshov.jpg`,
  botanical: `${appUrl}/cdn/image/upload/v1780787306/email/btanical.jpg`,
  chat: `${appUrl}/cdn/image/upload/v1780787308/email/chat.jpg`,
  colored: `${appUrl}/cdn/image/upload/v1780787309/email/colored.jpg`,
  newsletter: `${appUrl}/cdn/image/upload/v1780787310/email/newsletter.jpg`,
  passwordSuccessIllustration: `${appUrl}/cdn/image/upload/v1780787311/email/password_has_been_reset_successfully_concept_illus.jpg`,
  orderConfirmation: `${appUrl}/cdn/image/upload/v1780813790/email/an_ecommerce_concept_of_order_confirm_flat_illustration.jpg`,

  // Brand Logo
  logoTransparentWhite: `${appUrl}/cdn/image/upload/v1780751081/brand/logo_transparent_white.png`,
  logoTransparent: `${appUrl}/cdn/image/upload/v1780751080/brand/logo_transparent.png`,
  logoOatmeal: `${appUrl}/cdn/image/upload/v1780751083/brand/logo_oatmeal.png`,

  // Unsubscribe Assets
  unsubscribeHeader: `${appUrl}/cdn/image/upload/v1780811163/naturalist/cdn/ttszyfwvjvz9dzwedyvu.png`,
  unsubscribeButton: `${appUrl}/cdn/image/upload/v1780809897/naturalist/cdn/a0jgfonzac0dmdegvtqo.png`
};
