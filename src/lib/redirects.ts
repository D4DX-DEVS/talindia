/**
 * Permanent redirects for URLs that existed on the WordPress site.
 * Content-bearing URLs (/, /about-us/, /contact/, /courses/<slug>/, /all-service/<slug>/)
 * are served at their original paths and are not listed here.
 * Everything below was either a duplicate page, an unused theme demo page,
 * or a WordPress system URL. See docs/MIGRATION.md for the full inventory.
 */
interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const toHome = [
  "/home",
  "/home-2",
  "/home-talindia",
  "/sample-page",
  "/hello-world",
  "/blog",
  "/blog-grid",
  "/team",
  "/all-team/:slug*",
  "/all-project/:slug*",
  "/category/:slug*",
  "/tag/:slug*",
  "/author/:slug*",
  "/2024/:path*",
  "/2025/:path*",
  "/co-education-makes-you-respect-the-people",
  "/professional-ceramic-maudling-for-beginners",
  "/education-is-about-create-leaders-for-tomorrow",
  "/education-makes-a-door-to-bright-future",
  "/education-is-a-best-friend-goes-lifelong",
  "/professional-mobile-painting-and-sculpting",
  "/you-have-to-learn-if-you-want-to-earn",
  "/education-is-the-most-powerful-tool",
  "/essential-tips-for-building-a-responsive-web-design",
  "/shop",
  "/cart",
  "/cart-2",
  "/cart-3",
  "/checkout",
  "/checkout-2",
  "/checkout-3",
  "/my-account",
  "/dashboard",
  "/feed",
  "/comments/feed",
  "/terms-conditions",
  "/privacy-policy-2",
];

const toTrainings = ["/courses-grid", "/courses-list", "/courses", "/all-service"];
const toContact = ["/edugen/contact", "/student-registration", "/instructor-registration"];

const build = (sources: string[], destination: string): Redirect[] =>
  sources.map((source) => ({ source, destination, permanent: true }));

export const legacyRedirects: Redirect[] = [
  ...build(toHome, "/"),
  ...build(toTrainings, "/trainings/"),
  ...build(toContact, "/contact/"),
  // WordPress slug carried a stray "New Course" badge label; see migration/course-redirects.json.
  {
    source: "/courses/digital-sales-marketing-masterynew-course",
    destination: "/courses/digital-sales-marketing-mastery/",
    permanent: true,
  },
  // Every migrated WordPress upload keeps its path under /media/uploads/ in R2.
  { source: "/wp-content/uploads/:path*", destination: "/media/uploads/:path*", permanent: true },
];
