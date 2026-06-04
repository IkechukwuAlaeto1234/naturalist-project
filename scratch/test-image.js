async function test() {
  const urls = [
    "https://res.cloudinary.com/dtpwhaxvh/hero-banner.jpg",
    "https://res.cloudinary.com/dtpwhaxvh/image/upload/hero-banner.jpg",
    "https://res.cloudinary.com/dtpwhaxvh/image/upload/v1/hero-banner.jpg",
    "https://res.cloudinary.com/dtpwhaxvh/image/upload/naturalist/pages/hero-banner.jpg"
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, "-> Status:", res.status);
    } catch (err) {
      console.error(url, "-> Error:", err.message);
    }
  }
}
test();
