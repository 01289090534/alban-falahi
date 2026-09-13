import {FormEvent,useState} from 'react';
import {Eye,EyeOff,LockKeyhole,LogIn,Phone,UserRound} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import logoData from '../assets/logoData';

function loginIdentifier(value:string){
  const raw=value.trim();
  const digits=raw.replace(/\D/g,'');
  if(digits.length>=7&&digits===raw.replace(/[^0-9]/g,'')) return `${digits}@hr.alban-falahi.local`;
  if(raw.includes('@')) return raw;
  return `${raw.toLowerCase()}@hr.alban-falahi.local`;
}

export default function Login(){
  const navigate=useNavigate();
  const [identifier,setIdentifier]=useState('');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function submit(event:FormEvent){
    event.preventDefault();
    if(loading)return;
    setError('');
    const value=identifier.trim();
    if(!value||!password){setError('من فضلك اكتب رقم الموبايل أو حساب الموظف وكلمة المرور.');return;}
    setLoading(true);
    const {data,error:authError}=await supabase.auth.signInWithPassword({email:loginIdentifier(value),password});
    if(authError||!data.session){
      setLoading(false);
      setError('بيانات الدخول غير صحيحة. راجع الحساب وكلمة المرور وحاول مرة أخرى.');
      return;
    }
    navigate('/',{replace:true});
  }

  return <main className="login-page"><section className="login-card" aria-label="تسجيل الدخول">
    <div className="login-brand"><img src={logoData} alt="ألبان فلاحي"/><div><h1>ألبان فلاحي</h1><p>نظام إدارة الموارد البشرية</p></div></div>
    <form onSubmit={submit}>
      <label><span>رقم الموبايل أو حساب الموظف</span><div className="search"><UserRound size={18}/><input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="مثال: 01234567890" autoComplete="username" inputMode="text" autoFocus/></div></label>
      <label><span>كلمة المرور</span><div className="search"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="اكتب كلمة المرور" autoComplete="current-password"/><button type="button" className="icon-btn" aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      {error&&<div className="error">{error}</div>}
      <button className="primary full" type="submit" disabled={loading}><LogIn size={18}/>{loading?'جاري تسجيل الدخول...':'تسجيل الدخول'}</button>
    </form>
    <div className="login-footer">نظام داخلي خاص بسلسلة محلات ألبان فلاحي</div>
  </section></main>;
}
