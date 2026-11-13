import type { ExamId } from '../data/exams'

// Which service each exam leads to, marked in that service's colour. CDS feeds all three:
// IMA and OTA (Army), INA (Navy) and AFA (Air Force).

type ServiceId = 'army' | 'navy' | 'airforce' | 'coastguard' | 'capf' | 'civil'
export const SERVICES: Record<ServiceId, { label: string; dot: string }> = {
  army: { label: 'Army', dot: 'bg-army' },
  navy: { label: 'Navy', dot: 'bg-navy' },
  airforce: { label: 'Air Force', dot: 'bg-airforce' },
  coastguard: { label: 'Coast Guard', dot: 'bg-navy' },
  capf: { label: 'CAPF', dot: 'bg-khaki' },
  civil: { label: 'Civil services', dot: 'bg-saffron-400' },
}
const FOR_EXAM: Record<ExamId, ServiceId[]> = {
  cds: ['army', 'navy', 'airforce'],
  afcat: ['airforce'],
  icg: ['coastguard'],
  capf: ['capf'],
  cse: ['civil'],
}
const servicesOf = (exam: string) => FOR_EXAM[exam as ExamId] ?? []

/** "● Army ● Navy ● Air Force" */
export function ServiceTags({ exam }: { exam: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 caption-5 text-ink-400">
      {servicesOf(exam).map(s => (
        <span key={s} className="flex items-center gap-1"><span className={`size-2 rounded-full ${SERVICES[s].dot}`} />{SERVICES[s].label}</span>
      ))}
    </span>
  )
}

/** A short bar in the exam's service colours (three segments for CDS). */
export function ServiceStripe({ exam, className = '' }: { exam: string; className?: string }) {
  const list = servicesOf(exam)
  if (!list.length) return null
  return (
    <span className={`flex h-1 w-14 gap-[2px] ${className}`} title={list.map(s => SERVICES[s].label).join(', ')}>
      {list.map(s => <span key={s} className={`flex-1 rounded-full ${SERVICES[s].dot}`} />)}
    </span>
  )
}
