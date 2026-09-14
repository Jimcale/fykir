// One-off seed script for Firestore reference/demo data.
//
// IMPORTANT: run this only while firestore.seed.rules is deployed (temporary,
// permissive rules) — see the accompanying deploy steps. Re-deploy the real
// firestore.rules immediately after this finishes.
//
// Usage: node scripts/seed.mjs

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6z0oTVdZtbKmNA-u9KtuXSk1lvao2qVw",
  authDomain: "fykir-com.firebaseapp.com",
  projectId: "fykir-com",
  storageBucket: "fykir-com.firebasestorage.app",
  messagingSenderId: "227114808906",
  appId: "1:227114808906:web:1df80c3df1f2f0cc8798b3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInAnonymously(auth);

const hoursAgo = (h) => Timestamp.fromMillis(Date.now() - h * 3600_000);

// ---------------------------------------------------------------------------
// app_settings
// ---------------------------------------------------------------------------
await setDoc(doc(db, "app_settings", "global"), {
  countries: [
    {
      code: "KE",
      name: "Kenya",
      flag: "🇰🇪",
      city: "Nairobi",
      currency: "KES",
      cash_payout_fee: 5,
      status: "active",
      payment_methods: [
        { id: "mpesa", label: "M-Pesa", status: "active" },
        { id: "card", label: "Card", status: "coming_soon" },
      ],
    },
    {
      code: "UG",
      name: "Uganda",
      flag: "🇺🇬",
      city: "Kampala",
      currency: "UGX",
      cash_payout_fee: 5,
      status: "active",
      payment_methods: [
        { id: "mpesa", label: "Mobile Money", status: "active" },
        { id: "card", label: "Card", status: "coming_soon" },
      ],
    },
    {
      code: "SO",
      name: "Somalia",
      flag: "🇸🇴",
      city: "Mogadishu",
      currency: "USD",
      cash_payout_fee: 5,
      status: "coming_soon",
      payment_methods: [
        { id: "mpesa", label: "EVC Plus", status: "coming_soon" },
        { id: "card", label: "Card", status: "coming_soon" },
      ],
    },
  ],
});
console.log("✓ app_settings");

// ---------------------------------------------------------------------------
// gift_categories
// ---------------------------------------------------------------------------
const categories = [
  { id: "airtime", title: "Airtime", icon: "mobile-screen", color_key: "teal", min_amount: 50, max_amount: 5000, order: 1 },
  { id: "dining-out", title: "Dining Out", icon: "utensils", color_key: "pink", min_amount: 500, max_amount: 10000, order: 2 },
  { id: "birthday-cake", title: "Birthday Cake", icon: "cake-candles", color_key: "brand", min_amount: 800, max_amount: 6000, order: 3 },
  { id: "chocolates", title: "Chocolates", icon: "cookie", color_key: "orange", min_amount: 300, max_amount: 3000, order: 4 },
  { id: "flowers", title: "Flowers", icon: "seedling", color_key: "green", min_amount: 500, max_amount: 8000, order: 5 },
  { id: "movie-night", title: "Movie Night", icon: "clapperboard", color_key: "violet", min_amount: 500, max_amount: 4000, order: 6 },
  { id: "spa-day", title: "Spa Day", icon: "spa", color_key: "yellow", min_amount: 1500, max_amount: 15000, order: 7 },
];
for (const c of categories) {
  const { id, ...data } = c;
  await setDoc(doc(db, "gift_categories", id), data);
}
console.log(`✓ gift_categories (${categories.length})`);

// ---------------------------------------------------------------------------
// partners
// ---------------------------------------------------------------------------
const partners = [
  { id: "safaricom-westlands", name: "Safaricom Shop", business_type: "Telecom", address: "Sarit Centre, Westlands", city: "Nairobi", country: "KE", whatsapp: "+254700000001" },
  { id: "airtel-cbd", name: "Airtel Kenya", business_type: "Telecom", address: "Kenyatta Avenue", city: "Nairobi", country: "KE", whatsapp: "+254700000002" },
  { id: "java-kilimani", name: "Java House", business_type: "Restaurant", address: "Yaya Centre, Kilimani", city: "Nairobi", country: "KE", whatsapp: "+254700000003" },
  { id: "artcaffe-westgate", name: "Artcaffe", business_type: "Cafe", address: "Westgate Mall", city: "Nairobi", country: "KE", whatsapp: "+254700000004" },
  { id: "cake-republic", name: "Cake Republic", business_type: "Bakery", address: "Lavington Mall", city: "Nairobi", country: "KE", whatsapp: "+254700000005" },
  { id: "sugar-spice", name: "Sugar & Spice Bakery", business_type: "Bakery", address: "Nyali Road", city: "Mombasa", country: "KE", whatsapp: "+254700000006" },
  { id: "chocolate-city", name: "Chocolate City", business_type: "Chocolatier", address: "The Hub, Karen", city: "Nairobi", country: "KE", whatsapp: "+254700000007" },
  { id: "cocoa-lounge", name: "Cocoa Lounge", business_type: "Chocolatier", address: "Mega City Mall", city: "Kisumu", country: "KE", whatsapp: "+254700000008" },
  { id: "zawadi-flowers", name: "Zawadi Flowers", business_type: "Florist", address: "Muthaiga Square", city: "Nairobi", country: "KE", whatsapp: "+254700000009" },
  { id: "bloom-kenya", name: "Bloom Kenya", business_type: "Florist", address: "Westside Mall", city: "Nakuru", country: "KE", whatsapp: "+254700000010" },
  { id: "imax-kenya", name: "IMAX Kenya", business_type: "Cinema", address: "Panari Sky Centre", city: "Nairobi", country: "KE", whatsapp: "+254700000011" },
  { id: "century-cinemax", name: "Century Cinemax", business_type: "Cinema", address: "Nyali Cinemax Mall", city: "Mombasa", country: "KE", whatsapp: "+254700000012" },
  { id: "serene-spa", name: "Serene Spa", business_type: "Wellness", address: "Gigiri", city: "Nairobi", country: "KE", whatsapp: "+254700000013" },
  { id: "utamaduni-wellness", name: "Utamaduni Wellness", business_type: "Spa", address: "Diani Beach Road", city: "Diani", country: "KE", whatsapp: "+254700000014" },
];
for (const p of partners) {
  const { id, ...data } = p;
  await setDoc(doc(db, "partners", id), data);
}
console.log(`✓ partners (${partners.length})`);

// ---------------------------------------------------------------------------
// gift_products
// ---------------------------------------------------------------------------
const products = [
  { category: "airtime", partner: "safaricom-westlands", title: "KES 500 Airtime Top-up", price: 500, redeem_instructions: "Show this code at any Safaricom shop, or dial *544# and enter the code to redeem." },
  { category: "airtime", partner: "airtel-cbd", title: "KES 500 Airtime Top-up", price: 500, redeem_instructions: "Visit any Airtel shop with this code, or use the Airtel Money app to redeem." },
  { category: "dining-out", partner: "java-kilimani", title: "KES 1,000 Dining Voucher", price: 1000, redeem_instructions: "Present this code to your waiter at any Java House branch before paying your bill." },
  { category: "dining-out", partner: "artcaffe-westgate", title: "KES 1,500 Dining Voucher", price: 1500, redeem_instructions: "Show this code at the till at any Artcaffe branch." },
  { category: "birthday-cake", partner: "cake-republic", title: "1kg Celebration Cake", price: 2000, redeem_instructions: "Order in-store or via WhatsApp and quote this code — 24hr notice appreciated." },
  { category: "birthday-cake", partner: "sugar-spice", title: "1kg Birthday Cake", price: 1800, redeem_instructions: "Visit the Nyali Road branch and quote this code to collect your cake." },
  { category: "chocolates", partner: "chocolate-city", title: "Assorted Chocolate Box", price: 1200, redeem_instructions: "Show this code at the counter to collect your chocolate box." },
  { category: "chocolates", partner: "cocoa-lounge", title: "Chocolate Gift Hamper", price: 1500, redeem_instructions: "Present this code at Mega City Mall branch to collect your hamper." },
  { category: "flowers", partner: "zawadi-flowers", title: "Dozen Rose Bouquet", price: 2500, redeem_instructions: "Show this code in-store, or WhatsApp us this code for same-day delivery." },
  { category: "flowers", partner: "bloom-kenya", title: "Mixed Flower Bouquet", price: 2000, redeem_instructions: "Quote this code at our Westside Mall counter." },
  { category: "movie-night", partner: "imax-kenya", title: "2 Movie Tickets + Popcorn", price: 2200, redeem_instructions: "Show this code at the box office to collect your tickets and popcorn combo." },
  { category: "movie-night", partner: "century-cinemax", title: "2 Movie Tickets", price: 1600, redeem_instructions: "Present this code at the Nyali Cinemax box office." },
  { category: "spa-day", partner: "serene-spa", title: "60-min Full Body Massage", price: 4500, redeem_instructions: "Book via WhatsApp quoting this code, subject to availability." },
  { category: "spa-day", partner: "utamaduni-wellness", title: "Spa Day Package", price: 6000, redeem_instructions: "Call ahead to book and quote this code on arrival." },
];
{
  const batch = writeBatch(db);
  products.forEach((p) => {
    const ref = doc(db, "gift_products", `${p.category}__${p.partner}`);
    batch.set(ref, {
      gift_category_id: p.category,
      partner_id: p.partner,
      title: p.title,
      price: p.price,
      redeem_instructions: p.redeem_instructions,
    });
  });
  await batch.commit();
  console.log(`✓ gift_products (${products.length})`);
}

// ---------------------------------------------------------------------------
// demo pages (flavor content for search/discover + the homepage ticker;
// owner_uid is a non-real uid so nobody can accidentally claim/edit these)
// ---------------------------------------------------------------------------
const demoPages = [
  { username: "amina", display_name: "Amina Wanjiru", accent: "#e8407a", gradient: ["#e8407a", "#ff8a3d"], bio: "Coffee, cake and good vibes ☕🎂", featured: ["birthday-cake", "chocolates"], city: "Nairobi" },
  { username: "brian_ke", display_name: "Brian Otieno", accent: "#7c5cff", gradient: ["#7c5cff", "#e8407a"], bio: "Movie nights are my love language 🎬", featured: ["movie-night", "airtime"], city: "Mombasa" },
  { username: "faith_n", display_name: "Faith Njeri", accent: "#17b3a3", gradient: ["#17b3a3", "#7c5cff"], bio: "Flowers make everything better 🌸", featured: ["flowers", "spa-day"], city: "Kisumu" },
  { username: "kevo", display_name: "Kevin Mwangi", accent: "#ff8a3d", gradient: ["#ff8a3d", "#2f9e44"], bio: "Always down for good food 🍽️", featured: ["dining-out", "airtime"], city: "Nakuru" },
  { username: "mo_juma", display_name: "Mohamed Juma", accent: "#2f9e44", gradient: ["#2f9e44", "#17b3a3"], bio: "Spa days are self-care 🧖", featured: ["spa-day", "chocolates"], city: "Eldoret" },
  { username: "wanjiru", display_name: "Grace Wanjiru", accent: "#e8407a", gradient: ["#7c5cff", "#e8407a"], bio: "Send cake, always 🎂", featured: ["birthday-cake", "flowers"], city: "Thika" },
];
{
  const batch = writeBatch(db);
  demoPages.forEach((u, i) => {
    const cat = categories.find((c) => c.id === u.featured[0]);
    const cat2 = categories.find((c) => c.id === u.featured[1]);
    batch.set(doc(db, "pages", u.username), {
      username: u.username,
      display_name: u.display_name,
      whatsapp: `+25470000${(20 + i).toString().padStart(2, "0")}`,
      email: `${u.username}@example.com`,
      birthday: null,
      bio: u.bio,
      city: u.city,
      avatar_url: null,
      cover_url: null,
      accent_color: u.accent,
      cover_gradient: u.gradient,
      featured: [
        { category_id: u.featured[0], min_amount: cat?.min_amount ?? 500 },
        { category_id: u.featured[1], min_amount: cat2?.min_amount ?? 500 },
      ],
      owner_uid: `seed-demo-${u.username}`,
      country_code: "KE",
      created_at: hoursAgo(200 - i * 10),
    });
  });
  await batch.commit();
  console.log(`✓ demo pages (${demoPages.length})`);
}

// ---------------------------------------------------------------------------
// demo gifts (for the homepage "recent surprises" ticker)
// ---------------------------------------------------------------------------
const demoGifts = [
  { from: "Someone", anon: true, to: "amina", category: "birthday-cake", amount: 2000, hours: 1.5, status: "informed" },
  { from: "Brian", anon: false, to: "faith_n", category: "flowers", amount: 2500, hours: 3, status: "opened" },
  { from: "A Well-Wisher", anon: true, to: "kevo", category: "dining-out", amount: 1000, hours: 5, status: "redeemed" },
  { from: "Grace", anon: false, to: "mo_juma", category: "spa-day", amount: 4500, hours: 8, status: "opened" },
  { from: "Someone Who Cares", anon: true, to: "brian_ke", category: "movie-night", amount: 2200, hours: 12, status: "informed" },
  { from: "Amina", anon: false, to: "wanjiru", category: "chocolates", amount: 1200, hours: 20, status: "redeemed" },
  { from: "Secret Admirer", anon: true, to: "faith_n", category: "birthday-cake", amount: 3000, hours: 26, status: "opened" },
  { from: "Kevin", anon: false, to: "amina", category: "airtime", amount: 500, hours: 34, status: "informed" },
];
{
  const batch = writeBatch(db);
  demoGifts.forEach((g, i) => {
    const cat = categories.find((c) => c.id === g.category);
    const receiver = demoPages.find((p) => p.username === g.to);
    const ref = doc(db, "gifts", `seed-gift-${i + 1}`);
    batch.set(ref, {
      category_id: cat.id,
      category_title: cat.title,
      category_icon: cat.icon,
      category_color: cat.color_key,
      product_id: null,
      amount: g.amount,
      currency: "KES",
      country_code: "KE",
      city: "Nairobi",
      sender_uid: `seed-demo-sender-${i}`,
      sender_anonymous: g.anon,
      sender_label: g.from,
      receiver_page_id: g.to,
      receiver_username: g.to,
      receiver_display_name: receiver.display_name,
      status: g.status,
      redeem_method: g.status === "redeemed" ? "partner" : null,
      redemption: null,
      created_at: hoursAgo(g.hours),
      opened_at: g.status !== "informed" ? hoursAgo(g.hours - 0.1) : null,
      redeemed_at: g.status === "redeemed" ? hoursAgo(g.hours - 0.2) : null,
    });
  });
  await batch.commit();
  console.log(`✓ demo gifts (${demoGifts.length})`);
}

console.log("\nSeed complete. Now redeploy the real firestore.rules.");
process.exit(0);
