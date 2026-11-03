import { ButtonLink } from "@/components/site/button-link";

export default function NotFound() {
  return (
    <section className="bg-ground py-24 sm:py-32" aria-labelledby="nf-title">
      <div className="frame">
        <h1 id="nf-title" className="display text-[18vw] text-ink sm:text-[10vw]">Lost route</h1>
        <p className="mt-8 max-w-xl text-xl text-ink">This page is not on the departures board. It may have moved when the site was rebuilt.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/" size="lg">Back to home</ButtonLink>
          <ButtonLink href="/trainings/" variant="ink" size="lg">See trainings</ButtonLink>
        </div>
      </div>
    </section>
  );
}
