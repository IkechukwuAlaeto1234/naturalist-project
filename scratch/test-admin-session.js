async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/login", {
      headers: {
        Host: "admin.localhost:3000"
      },
      redirect: "manual" // Do not follow redirects automatically so we can see the status and location
    });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Body preview:", text.slice(0, 500));
  } catch (err) {
    console.error(err);
  }
}
test();


