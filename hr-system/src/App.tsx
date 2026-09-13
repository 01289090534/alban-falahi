import {useEffect,useState} from 'react';
import {Navigate,Route,Routes,useNavigate} from 'react-router-dom';
import {supabase} from './lib/supabase';
import type {Profile} from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Branches from './pages/Branches';
import Attendance from './pages/Attendance';
import Closeouts from './pages/Closeouts';
import Overtime from './pages/Overtime';
import Money from './pages/Money';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Layout from './components/Layout';

const wait=<T,>(p:PromiseLike<T>,ms=10000)=>Promise.race([p,new Promise<never>((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);

async function getProfile():Promise<Profile|null>{
  const sessionResult=await wait(supabase.auth.getSession());
  const session=sessionResult.data.session;
  if(!session?.user)return null;
  const rpc=await wait(supabase.rpc('hr_v2_get_my_profile'));
  if(!rpc.error){
    const raw=rpc.data as Profile|string|null;
    const profile=typeof raw==='string'?JSON.parse(raw):raw;
    if(profile?.id&&profile?.is_active)return profile as Profile;
  }
  const direct=await wait(supabase.from('hr_v2_accounts').select('id,full_name,phone,role,employee_id,is_active,permissions').eq('id',session.user.id).eq('is_active',true).maybeSingle());
  if(!direct.error&&direct.data)return direct.data as Profile;
  return null;
}

export default function App(){
  const[p,setP]=useState<Profile|null>(null);
  const[loading,setLoading]=useState(true);
  const[authError,setAuthError]=useState('');
  const nav=useNavigate();

  useEffect(()=>{
    let alive=true;
    let busy=false;
    const restore=async()=>{
      if(busy)return;
      busy=true;
      try{
        const profile=await getProfile();
        if(!alive)return;
        setP(profile);setLoading(false);
        if(!profile){
          const s=await supabase.auth.getSession();
          if(alive&&!s.data.session)nav('/login',{replace:true});
          else setAuthError('تم تسجيل الدخول لكن تعذر تحميل بيانات الحساب.');
        }else setAuthError('');
      }catch{
        if(!alive)return;
        setP(null);setLoading(false);
        const s=await supabase.auth.getSession();
        if(!s.data.session)nav('/login',{replace:true});
        else setAuthError('تم تسجيل الدخول لكن تعذر تحميل بيانات الحساب.');
      }finally{busy=false}
    };
    void restore();
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(!alive)return;
      if(event==='SIGNED_OUT'){
        setP(null);setAuthError('');setLoading(false);nav('/login',{replace:true});return;
      }
      if(event==='SIGNED_IN'&&session?.user)void restore();
    });
    return()=>{alive=false;subscription.unsubscribe()};
  },[nav]);

  if(loading)return <div className="loading">جاري تحميل ألبان فلاحي...</div>;
  if(authError&&!p)return <div className="loading">{authError}<br/><button className="primary" onClick={()=>window.location.reload()}>إعادة المحاولة</button></div>;

  return <Routes>
    <Route path="/login" element={p?<Navigate to="/" replace/>:<Login/>}/>
    <Route element={p?<Layout profile={p}/>:<Navigate to="/login" replace/>}>
      <Route index element={<Dashboard profile={p!}/>}/>
      <Route path="employees" element={p?.role==='admin'?<Employees/>:<Navigate to="/" replace/>}/>
      <Route path="branches" element={p?.role==='admin'?<Branches/>:<Navigate to="/login" replace/>}/>
      <Route path="attendance" element={<Attendance/>}/>
      <Route path="closeouts" element={p?.role==='admin'||p?.role==='accountant'?<Closeouts profile={p!}/>:<Navigate to="/login" replace/>}/>
      <Route path="overtime" element={<Overtime profile={p!}/>}/>
      <Route path="money" element={<Money profile={p!}/>}/>
      <Route path="payroll" element={<Payroll profile={p!}/>}/>
      <Route path="reports" element={p?.role!=='employee'?<Reports/>:<Navigate to="/" replace/>}/>
      <Route path="users" element={p?.role==='admin'?<Users/>:<Navigate to="/login" replace/>}/>
      <Route path="settings" element={<Settings profile={p!}/>}/>
    </Route>
    <Route path="*" element={<Navigate to={p?'/':'/login'} replace/>}/>
  </Routes>;
}
