import { Nav } from "@/components/nav";
import { ScoringRulesContent } from "@/components/scoring-rules-content";

export default function ScoringPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scoring</h1>
          <p className="mt-1 text-slate-600">
            How points are awarded for regular time and knockout extra time / penalties.
          </p>
        </div>
        <ScoringRulesContent />
      </main>
    </>
  );
}
