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
import { api } from '../lib/api.js'
import { allExercises } from '../lib/exercises.js'

export default function Plan() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [section, setSection] = useState('plan')
  const [previewId, setPreviewId] = useState(null)
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiDays, setAiDays] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiDraft, setAiDraft] = useState(null)

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] }
    update(s => { s.routines.push(r) })
    nav('/plan/r/' + r.id)
  }

  const daysFor = id => [1, 2, 3, 4, 5, 6, 0]
    .filter(d => S.week[d] === id)
    .map(d => t(DAYN[d]))
  const togglePreview = id => setPreviewId(current => current === id ? null : id)
  const weekDays = [{ id: 1, name: 'Segunda' }, { id: 2, name: 'Terça' }, { id: 3, name: 'Quarta' }, { id: 4, name: 'Quinta' }, { id: 5, name: 'Sexta' }, { id: 6, name: 'Sábado' }, { id: 0, name: 'Domingo' }]
  const generateWithAI = async () => {
    setAiLoading(true); setAiError(''); setAiDraft(null)
    try {
      const catalog = allExercises(S).map(ex => ({ id: ex.id, name: ex.n, muscle: ex.bp, equipment: ex.eq }))
      const result = await api('/api/ai/workout', { method: 'POST', body: JSON.stringify({ instructions: aiInstructions, days: aiDays.map(d => weekDays.find(x => x.id === d)?.name), catalog }) })
      setAiDraft(result.routine)
    } catch (e) { setAiError(e.message || 'Não foi possível gerar o treino.') }
    finally { setAiLoading(false) }
  }
  const saveAIDraft = () => {
    if (!aiDraft) return
    const routine = { id: uid(), name: aiDraft.name, emoji: DEFAULT_GLYPH, ex: aiDraft.ex }
    update(s => { s.routines.push(routine); aiDays.forEach(d => { s.week[d] = routine.id }) })
    setAiDraft(null); setAiInstructions(''); setAiDays([]); setSection('ready')
  }

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
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Criar treino com IA</h3>
        <div className="small dim" style={{ marginBottom: 10 }}>Descreva como deseja o treino. A IA usará os exercícios disponíveis e você poderá revisar antes de salvar.</div>
        <textarea className="input" rows="4" value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} placeholder="Ex.: monte um treino de hipertrofia para iniciantes, com foco em pernas e glúteos, 5 exercícios..." style={{ width: '100%', resize: 'vertical' }} />
        <div className="small" style={{ margin: '12px 0 6px', fontWeight: 600 }}>Dias da semana (opcional)</div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {weekDays.map(d => <label key={d.id} className="tag" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={aiDays.includes(d.id)} onChange={e => setAiDays(current => e.target.checked ? [...current, d.id] : current.filter(x => x !== d.id))} /> {d.name}
          </label>)}
        </div>
        {aiError && <div className="small" style={{ color: 'var(--red)', marginTop: 10 }}>{aiError}</div>}
        <Button block variant="primary" icon="sparkles" onClick={generateWithAI} disabled={aiLoading || !aiInstructions.trim()}>{aiLoading ? 'Criando treino...' : 'Gerar treino com IA'}</Button>
        {aiDraft && <div style={{ marginTop: 14, borderTop: '1px solid var(--sep)', paddingTop: 12 }}>
          <h3 style={{ margin: '0 0 4px' }}>{aiDraft.name}</h3>
          {aiDraft.notes && <div className="small dim" style={{ marginBottom: 8 }}>{aiDraft.notes}</div>}
          {aiDraft.ex.map((entry, index) => <div key={index} className="row between" style={{ padding: '8px 0', borderTop: '1px solid var(--sep)' }}>
            <div className="grow"><div className="tt">{index + 1}. {exName(exOr(entry.id))}</div><div className="ss">{exLine(entry, S.unit)}</div></div>
            <span className="tag">{entry.rest}s</span>
          </div>)}
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <Button size="sm" variant="primary" onClick={saveAIDraft}>Salvar treino</Button>
            <Button size="sm" variant="tinted" onClick={() => setAiDraft(null)}>Descartar</Button>
          </div>
        </div>}
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
