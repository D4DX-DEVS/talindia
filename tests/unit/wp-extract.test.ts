import { describe, expect, it } from "vitest";
import pages from "../fixtures/wp-pages.json";
import wpCourses from "../fixtures/wp-courses.json";
import {
  blocksOf,
  decodeCfEmail,
  decodeEntities,
  insertSql,
  parseAbout,
  parseCourse,
  parseHome,
  sqlString,
  testimonialRoles,
  uploadKey,
  type WpEntity,
} from "../../scripts/lib/wp-extract";

const home = pages.find((p) => p.id === 866) as unknown as WpEntity;
const about = pages.find((p) => p.id === 1160) as unknown as WpEntity;

describe("WordPress extraction", () => {
  it("extracts every home-page section with the expected counts", () => {
    const h = parseHome(home);
    expect(h.heroTitle).toBe("Upskill . Reskill. Get Placed");
    expect(h.serviceTitles).toEqual([
      "Individual Skill Development",
      "Job Placement Assistance",
      "Corporate Training Solutions",
      "Learning & Development Platform",
    ]);
    expect(h.whyChoose.map((w) => w.title)).toEqual(["Future-Ready Skills", "Expert Instructors", "Practical Learning"]);
    expect(h.homeCourses).toHaveLength(4);
    expect(h.offerings).toHaveLength(6);
    expect(h.testimonials.map((t) => t.name)).toEqual(["Priya Sharma", "Rahul Kumar", "Anjali Patel"]);
    expect(h.webinarTitle).not.toMatch(/"$/);
  });

  it("extracts the four About paragraphs", () => {
    const a = parseAbout(about);
    expect(a.heading).toBe("About Talindia");
    expect(a.paragraphs).toHaveLength(4);
    expect(a.paragraphs[1]).toMatch(/^Born from the desire/);
  });

  it("splits course bodies into audience, highlights and market gap", () => {
    const sap = parseCourse(wpCourses.find((c) => c.slug.startsWith("sap")) as unknown as WpEntity);
    expect(sap.audience).toBe("Non-finance executives transitioning to finance roles");
    expect(sap.highlights).toHaveLength(3);
    expect(sap.marketGap).toBe("High demand for SAP-skilled professionals in UAE/KSA markets");
    expect(sap.imageLegacyId).toBe(1477);
  });

  it("throws instead of silently dropping content when anchors are missing", () => {
    const broken = { ...home, content: { rendered: "<p>nothing here</p>" } };
    expect(() => parseHome(broken)).toThrow(/Migration/);
  });

  it("does not treat <path> or <param> as paragraphs", () => {
    expect(blocksOf('<svg><path d="M0"></path></svg><p>Real</p>')).toEqual([{ tag: "p", text: "Real" }]);
  });

  it("reads testimonial roles from the rendered page text", () => {
    const html = "<div>Priya Sharma</div><span>Software Developer</span><p>The practical</p>";
    expect(testimonialRoles(html, ["Priya Sharma"])).toEqual({ "Priya Sharma": "Software Developer" });
  });
});

describe("helpers", () => {
  it("decodes Cloudflare-obfuscated emails", () => {
    expect(decodeCfEmail("3c55525a537c485d50555258555d125f53")).toBe("info@talindia.co");
  });

  it("decodes the HTML entities WordPress emits", () => {
    expect(decodeEntities("SAP &#038; Excel &#8211; don&#8217;t")).toBe("SAP & Excel – don’t");
  });

  it("escapes SQL string literals", () => {
    expect(sqlString("TALINDIA's")).toBe("'TALINDIA''s'");
    expect(insertSql("t", { a: 1, b: null, c: "x'y", d: true })).toBe(`INSERT INTO t ("a", "b", "c", "d") VALUES (1, NULL, 'x''y', 1);`);
  });

  it("maps upload URLs to R2 keys and rejects others", () => {
    expect(uploadKey("https://talindia.co/wp-content/uploads/2025/08/logo%20x.png")).toBe("uploads/2025/08/logo x.png");
    expect(() => uploadKey("https://talindia.co/about-us/")).toThrow();
  });
});
