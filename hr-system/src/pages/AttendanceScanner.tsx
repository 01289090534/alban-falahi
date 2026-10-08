import {useEffect,useRef,useState} from 'react';
import {Clock3,LogIn,LogOut,LogOut as SignOut} from 'lucide-react';
import type {Profile} from '../types';
import {supabase} from '../lib/supabase';

export default function AttendanceScanner({profile}:{profile:Profile}){
 const[input,setInput]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[lastAction,setLastAction]=useState('');
 const ref=useRef<HTMLInputElement>(null);
 useEffect(()=>{ref.current?.focus()},[]);
 async function scan(e:React.FormEvent){e.preventDefault();const token=input.trim();if(!token||busy)return;setBusy(true);setError('');setMessage('');const{data,error}=await supabase.rpc('hr_v2_attendance_operator_scan',{p_token:token});if(error)setError(error.message);else{setLastAction(data?.action||'');setMessage(data?.action==='check_out'?'تم تسجيل الانصراف بنجاح':'تم تسجيل الحضور بنجاح')}setInput('');setBusy(false);setTimeout(()=>ref.current?.focus(),20)}
 async function logout(){await supabase.auth.signOut();window.location.href='/login'}
 return <main className="login-page" dir="rtl"><section className="login-card" style={{maxWidth:520,textAlign:'center'}}><div className="login-brand"><Clock3 size={40}/><div><h1>الحضور والانصراف</h1><p>{profile.full_name}</p></div></div><p className="muted">شاشة مسح فقط — لا تعرض بيانات الموظفين أو الرواتب أو التقارير.</p><form onSubmit={scan}><label style={{textAlign:'right',display:'block'}}><span>امسح باركود الموظف</span><input ref={ref} value={input} onChange={e=>setInput(e.target.value)} autoComplete="off" autoFocus placeholder="الماسح يكتب الكود هنا تلقائيًا" disabled={busy}/></label><button className="primary full" type="submit" disabled={busy||!input.trim()}><Clock3 size={19}/>{busy?'جاري التسجيل...':'تسجيل الحضور / الانصراف'}</button></form>{message&&<div className="success" style={{marginTop:14}}>{lastAction==='check_out'?<LogOut size={18}/>:<LogIn size={18}/>} {message}</div>}{error&&<div className="error" style={{marginTop:14}}>{error}</div>}<button className="secondary full" style={{marginTop:14}} onClick={logout}><SignOut size={18}/>تسجيل الخروج</button></section></main>;
}
