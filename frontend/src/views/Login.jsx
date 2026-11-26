import { useStore, hasData } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { useState, useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

function RegisterSheet({ close }) {
  const { setUser, pushState, pullState } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [inviteOnly, setInviteOnly] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { api('/api/config').then(c => setInviteOnly(!!c.invite_only)).catch(() => {}) }, [])

  const submit = async () => {
    if (busy) return
    if (password !== confirm) return useUI.getState().toast('As senhas não conferem.')
    setBusy(true)
    try {
      const result = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, code })
      })
      setUser(result.user)
      close()
      if (hasData(useStore.getState().S)) {
        await pushState()
        useUI.getState().toast('Cadastro criado! Seus dados deste dispositivo foram associados à conta.')
      } else {
        await pullState()
        useUI.getState().toast('Bem-vindo(a), ' + result.user.name + '!')
      }
    } catch (e) {
      useUI.getState().toast(e.message || 'Não foi possível criar a conta.')
    } finally { setBusy(false) }
  }

  return <>
    <h3> criar sua conta </h3>
    <div className="muted small" style={{ marginBottom: 14 }}>
      Cadastre seu nome, e-mail e uma senha. Você usará esses dados para entrar no JeffGyn.
    </div>
    <input className="input" placeholder="Nome completo" maxLength={40} autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
    <div style={{ height: 10 }} />
    <input className="input" type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
    <div style={{ height: 10 }} />
    <input className="input" type="password" placeholder="Crie uma senha (mínimo 8 caracteres)" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
    <div style={{ height: 10 }} />
    <input className="input" type="password" placeholder="Confirme sua senha" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
    {inviteOnly && <>
      <div style={{ height: 10 }} />
      <input className="input" placeholder="Código de convite" maxLength={40} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
    </>}
    <div style={{ height: 14 }} />
    <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Criando conta…' : 'Criar minha conta'}</Button>
    <div className="dim small" style={{ marginTop: 12 }}>Use uma senha exclusiva e não compartilhe seus dados de acesso.</div>
  </>
}

export default function Login() {
  const { setUser, pullState } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const signIn = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      setUser(result.user)
      await pullState()
      useUI.getState().toast('Bem-vindo(a) de volta, ' + result.user.name + '!')
    } catch (e) {
      useUI.getState().toast(e.message || 'Não foi possível entrar.')
    } finally { setBusy(false) }
  }

  const head = <>
    <div style={{ fontSize: 54, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}><Icon name="dumbbell" /></div>
    <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.028em', margin: '10px 0 4px' }}>Meu JeffGyn</h1>
  </>
  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh', textAlign: 'center' }

  return (
    <div className="narrow" style={wrap}>
      {head}
      <div className="muted" style={{ marginBottom: 24 }}>Seus treinos. Seus pesos. Seu perfil.</div>
      <input className="input" type="email" placeholder="Seu e-mail" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && signIn()} />
      <div style={{ height: 10 }} />
      <input className="input" type="password" placeholder="Sua senha" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && signIn()} />
      <div style={{ height: 14 }} />
      <Button variant="primary" icon="person" onClick={signIn} disabled={busy}>{busy ? 'Entrando…' : 'Entrar com e-mail e senha'}</Button>
      <div style={{ height: 10 }} />
      <Button icon="sparkles" onClick={() => useUI.getState().openSheet(close => <RegisterSheet close={close} />)}>Criar conta de aluno</Button>
      <div style={{ height: 10 }} />
      <Button variant="ghost" className="dim" onClick={() => setGuest(true)}>Continuar sem conta</Button>
      <div className="dim small" style={{ marginTop: 22, lineHeight: 1.5 }}>
        Acesse com seu e-mail e senha. Cada aluno tem seus próprios treinos.
      </div>
    </div>
  )
}
