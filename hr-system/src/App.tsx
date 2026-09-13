import {useEffect,useState} from 'react';
import {Navigate,Route,Routes} from 'react-router-dom';
import type {Session} from '@supabase/supabase-js';
import type {Profile} from './types';
import {supabase} from './lib/supabase';
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

function Loading(){return <div className="loading">جاري التحقق من تسجيل الدخول...</div>}

function ProtectedApp({profile}:{profile:Profile}){
  return <Routes>
    <Route element={<Layout profile={profile}/>}> 
      <Route index element={<Dashboard profile={profile}/>}/>
      <Route path="employees" element={<Employees/>}/>
      <Route path="branches" element={<Branches/>}/>
      <Route path="attendance" element={<Attendance/>}/>
      <Route path="closeouts" element={<Closeouts profile={profile}/>}/>
      <Route path="overtime" element={<Overtime profile={profile}/>}/>
      <Route path="money" element={<Money profile={profile}/>}/>
      <Route path="payroll" element={<Payroll profile={profile}/>}/>
      <Route path="reports" element={<Reports/>}/>
      <Route path="users" element={<Users/>}/>
      <Route path="settings" element={<Settings profile={profile}/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}

export default function App(){
  const [session,setSession]=useState<Session|null>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [ready,setReady]=useState(false);
  const [profileError,setProfileError]=useState('');

  useEffect(()=>{
    let alive=true;
    supabase.auth.getSession().then(({data})=>{
      if(!alive)return;
      setSession(data.session);
      if(!data.session)setReady(true);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      if(!alive)return;
      setSession(nextSession);
      if(!nextSession){setProfile(null);setProfileError('');setReady(true);}
      else setReady(false);
    });
    return()=>{alive=false;subscription.unsubscribe()};
  },[]);

  useEffect(()=>{
    if(!session){setProfile(null);return}
    let alive=true;
    (async()=>{
      setProfileError('');
      const {data,error}=await supabase.rpc('hr_v2_get_my_profile');
      if(!alive)return;
      if(error||!data?.id){setProfileError('تعذر تحميل بيانات المستخدم.');setProfile(null);setReady(true);return}
      setProfile(data as Profile);
      setReady(true);
    })();
    return()=>{alive=false};
  },[session]);

  if(!ready)return <Loading/>;
  if(!session)return <Routes><Route path="/login" element={<Login/>}/><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>;
  if(profileError||!profile)return <div className="login-page"><section className="login-card"><div className="error">{profileError||'تعذر تحميل بيانات المستخدم.'}</div><button className="primary full" onClick={()=>supabase.auth.signOut()}>العودة لتسجيل الدخول</button></section></div>;
  return <ProtectedApp profile={profile}/>;
}
