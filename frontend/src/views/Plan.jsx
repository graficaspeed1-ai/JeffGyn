import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { DAYN, uid, exCount } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { dayAssignSheet, loadStarterPlan, planToolsSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf, DEFAULT_GLYPH } from '../lib/glyphs.js'
import { exOr, exName } from '../lib/exercises.js'
import { exLine } from '../lib/history.js'

export default function Plan() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [section, setSection] = useState('plan')
  const [previewId, setPreviewId] = useState(null)

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] }
    update(s => { s.routines.push(r) })
    nav('/plan/r/' + r.id)
  }

  const daysFor = id => [1, 2, 3, 4, 5, 6, 0]
    .filter(d => S.week[d] === id)
    .map(d => t(DAYN[d]))
  const togglePreview = id => setPreviewId(current => current === id ? null : id)

  return <>
    <div className="hdr">
      <div><h1>{t('Plan')}</h1><div className="sub">{t('Your weekly routine')}</div></div>
      <button className="iconbtn" onClick={planToolsSheet} aria-label={t('Share your plan')} title={t('Share your plan')}><Icon name="upload" /></button>
    </div>

    <div className="row" style={{ gap: 8, margin: '0 0 18px' }}>
      <Button size="sm" variant={section === 'plan' ? 'primary' : 'tinted'} onClick={() => setSection('plan')}>Plano semanal</Button>
      <Button size="sm" variant={section === 'ready' ? 'primary' : 'tinted'} onClick={() => setSection('ready')}>Treinos prontos</Button>
    </div>

    {section === 'plan' ? <div className="cols"><div>
      <h4 className="sec">{t('Week schedule')}</h4>
      <div className="list" style={{ display: 'flex', flexDirection: 'column' }}>
        {[1, 2, 3, 4, 5, 6, 0].map(d => {
          const r = S.routines.find(x => x.id === S.week[d])
          return <div key={d} className="item" onClick={() => dayAssignSheet(d)}>
            <div className="grow"><div className="tt">{t(DAYN[d])}</div></div>
            {r ? <span className="tag acc"><Icon name={glyphOf(r.emoji)} />{r.name}</span> : <span className="tag">{t('Rest')}</span>}
            <Icon name="chevronRight" className="chev" /></div>
        })}
      </div>
    </div><div>
      <div className="row between" style={{ marginTop: 22, marginBottom: 10 }}>
        <h4 className="sec" style={{ margin: 0 }}>{t('Routines')}</h4>
        <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine}>{t('New')}</Button>
      </div>
      {S.routines.length ? <div className="list">{S.routines.map(r => <div key={r.id} className="item" onClick={() => nav('/plan/r/' + r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="tt">{r.name}</div><div className="ss">{exCount(r.ex.length)}</div></div>
        <Icon name="chevronRight" className="chev" /></div>)}</div> : <>
        <div className="empty"><div className="ico"><Icon name="clipboard" /></div>{t('No routines yet.')}<br />{t('Create one or load the starter plan.')}</div>
        <Button icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (Push / Pull / Legs)')}</Button>
      </>}
    </div></div> : <div className="narrow">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div><h3 style={{ margin: 0 }}>Treinos prontos</h3><div className="sub">Consulte suas fichas sem iniciar um treino</div></div>
        <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine}>Novo treino</Button>
      </div>
      {!S.routines.length ? <div className="empty"><div className="ico"><Icon name="clipboard" /></div>Você ainda não tem treinos cadastrados.</div> :
        <div className="list">{S.routines.map(r => {
          const days = daysFor(r.id)
          const opened = previewId === r.id
          return <div className="card" key={r.id} style={{ marginBottom: 10 }}>
            <div className="row between" style={{ gap: 10 }}>
              <div className="row" style={{ minWidth: 0, gap: 10 }}>
                <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
                <div className="grow"><div className="tt">{r.name}</div><div className="ss">{r.ex.length} exercício(s){days.length ? ' · ' + days.join(', ') : ' · Sem dia definido'}</div></div>
              </div>
              <button className="iconbtn" onClick={() => togglePreview(r.id)} aria-label={opened ? 'Fechar ficha' : 'Ver ficha'}><Icon name={opened ? 'chevronUp' : 'chevronDown'} /></button>
            </div>
            {opened && <div style={{ marginTop: 14 }}>
              {r.ex.length ? r.ex.map((entry, index) => {
                const exercise = exOr(entry.id)
                return <div key={index} className="row between" style={{ alignItems: 'flex-start', gap: 10, padding: '10px 0', borderTop: '1px solid var(--sep)' }}>
                  <div className="grow"><div className="tt">{index + 1}. {exName(exercise)}</div><div className="ss">{exLine(entry, S.unit)}</div></div>
                  <span className="tag">{entry.rest ?? S.restSec ?? 90}s descanso</span>
                </div>
              }) : <div className="small dim">Esta ficha ainda não tem exercícios.</div>}
              <div className="row" style={{ marginTop: 10 }}>
                <Button size="sm" variant="tinted" icon="pencil" onClick={() => nav('/plan/r/' + r.id)}>Editar ficha</Button>
              </div>
            </div>}
          </div>
        })}
        </div>}
    </div>}
  </>
}
