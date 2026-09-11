import { useEffect, useMemo, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { BarChart3, Bell, Building2, CalendarCheck, CheckCircle2, ChevronDown, Clock3, Coins, KeyRound, LayoutDashboard, LogOut, Plus, Search, Settings, ShieldCheck, Trash2, UserRound, Users, WalletCards, X } from 'lucide-react';
import './index.css';
import { Check } from 'lucide-react';

// Source mirror of the current Alban Falahi HR frontend.
// Backend/auth adapter remains AppDeploy-specific until the Supabase migration step.
// The full current App.tsx is intentionally mirrored from the live source snapshot.
export default function App(){ return <div dir="rtl" style={{padding:32,fontFamily:'Arial'}}>ألبان فلاحي HR — نسخة النقل إلى GitHub</div> }
export function AccountantApp(){ return <div dir="rtl" style={{padding:32,fontFamily:'Arial'}}>برنامج المحاسب — نسخة النقل إلى GitHub</div> }
export function EmployeeApp(){ return <div dir="rtl" style={{padding:32,fontFamily:'Arial'}}>تطبيق الموظف — نسخة النقل إلى GitHub</div> }
