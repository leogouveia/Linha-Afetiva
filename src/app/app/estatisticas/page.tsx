import { inArray } from "drizzle-orm";
import { DonutChart } from "@/components/charts/donut-chart";
import { Histogram } from "@/components/charts/histogram";
import { StatBlock } from "@/components/stat-block";
import { db } from "@/lib/db";
import { eventTags, people, personTags, timelineEvents } from "@/lib/db/schema";
import {
  buildDurationSummary,
  buildEventFrequencyByMonth,
  buildOriginSlices,
  buildStatusSlices,
  buildToneBuckets,
  countBy,
} from "@/lib/stats";
import { loadTagOptions } from "@/lib/tags";
import { eventTypeLabels, outcomeLabels, type EventType, type Outcome } from "@/lib/validation/event";

function formatDuration(months: number) {
  const rounded = Math.round(months);
  if (rounded < 12) return `${rounded} ${rounded === 1 ? "mês" : "meses"}`;
  const years = Math.floor(rounded / 12);
  const remainder = rounded % 12;
  const yearsLabel = `${years} ${years === 1 ? "ano" : "anos"}`;
  return remainder === 0 ? yearsLabel : `${yearsLabel} e ${remainder} ${remainder === 1 ? "mês" : "meses"}`;
}

export default async function EstatisticasPage() {
  const [peopleRows, eventRows, allTags] = await Promise.all([
    db.select({ id: people.id, origin: people.origin, currentStatus: people.currentStatus, startedAt: people.startedAt, endedAt: people.endedAt }).from(people),
    db.select({ id: timelineEvents.id, personId: timelineEvents.personId, date: timelineEvents.date, emotionalTone: timelineEvents.emotionalTone, outcome: timelineEvents.outcome, eventType: timelineEvents.eventType }).from(timelineEvents),
    loadTagOptions(),
  ]);
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));
  const [eventTagLinks, relationshipTagLinks] = await Promise.all([
    eventRows.length
      ? db.select({ eventId: eventTags.eventId, tagId: eventTags.tagId }).from(eventTags).where(inArray(eventTags.eventId, eventRows.map((event) => event.id)))
      : Promise.resolve([]),
    db.select({ tagId: personTags.tagId }).from(personTags),
  ]);

  const originSlices = buildOriginSlices(peopleRows);
  const statusSlices = buildStatusSlices(peopleRows);
  const duration = buildDurationSummary(peopleRows);
  const toneBuckets = buildToneBuckets(eventRows);
  const frequencyBuckets = buildEventFrequencyByMonth(eventRows);
  const outcomeStats = countBy(eventRows, (event) => (event.outcome ? outcomeLabels[event.outcome as Outcome] : null));
  const eventTypeStats = countBy(eventRows, (event) => (event.eventType ? eventTypeLabels[event.eventType as EventType] : null));
  const relationshipTagStats = countBy(relationshipTagLinks, (link) => tagById.get(link.tagId)?.name ?? null);
  const eventTagStats = countBy(eventTagLinks, (link) => tagById.get(link.tagId)?.name ?? null);

  return (
    <div>
      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Visão geral</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">Estatísticas</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Padrões da sua linha afetiva, a partir das pessoas e registros já cadastrados.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <DonutChart title="Origem das pessoas" slices={originSlices} emptyLabel="Nenhuma pessoa cadastrada ainda." />
        <DonutChart title="Status atual do portfólio" slices={statusSlices} emptyLabel="Nenhuma pessoa cadastrada ainda." />
      </div>

      <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
        <h3 className="text-sm font-semibold text-violet-950 dark:text-violet-100">Duração das relações encerradas</h3>
        {duration.count === 0 ? (
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Nenhuma relação encerrada com início e término preenchidos ainda.</p>
        ) : (
          <>
            <p className="mt-3 text-2xl font-semibold text-violet-950 dark:text-violet-100">≈ {formatDuration(duration.medianMonths ?? 0)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Mediana de {duration.count} {duration.count === 1 ? "relação encerrada" : "relações encerradas"}
              {duration.count < 3 && " · Poucos dados para conclusões sólidas"}
            </p>
            <div className="mt-4">
              <Histogram title="Faixas de duração" bars={duration.buckets} emptyLabel="Sem dados." />
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <Histogram title="Tom emocional dos registros" bars={toneBuckets} emptyLabel="Nenhum tom emocional informado ainda." />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatBlock title="Resultados dos eventos" items={outcomeStats} emptyLabel="Nenhum resultado informado ainda." />
        <StatBlock title="Tipos de evento" items={eventTypeStats} emptyLabel="Nenhum tipo informado ainda." />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatBlock title="Tags de relação mais frequentes" items={relationshipTagStats} emptyLabel="Nenhuma tag de relação ainda." />
        <StatBlock title="Tags de evento mais frequentes" items={eventTagStats} emptyLabel="Nenhuma tag de evento ainda." />
      </div>

      <div className="mt-4">
        <Histogram title="Frequência de registros (últimos 12 meses)" bars={frequencyBuckets} emptyLabel="Nenhum registro nos últimos 12 meses." />
      </div>
    </div>
  );
}
