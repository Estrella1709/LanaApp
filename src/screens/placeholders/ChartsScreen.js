// src/screens/ChartsScreen.js
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { apiFetch, getToken } from '../services/api';

export default function ChartsScreen() {
  const [mode, setMode] = useState('income'); // 'income' | 'expense' | 'general'
  const [loading, setLoading] = useState(false);
  const [rowsIncome, setRowsIncome] = useState([]);   // [{mes:'YYYY-MM', categoria:'...', total:Number}]
  const [rowsExpense, setRowsExpense] = useState([]); // idem
  const [selectedMonth, setSelectedMonth] = useState(null); // 'YYYY-MM'

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // <-- IMPORTANTE: obtener token y agregarlo al query
        const token = await getToken();
        const q = token ? `?token=${encodeURIComponent(token)}` : '';

        const inc = await apiFetch(`/api/graficaIngresos${q}`);
        const exp = await apiFetch(`/api/graficaGastos${q}`);

        const normInc = Array.isArray(inc) ? inc.map(r => ({
          mes: String(r.mes ?? r.Mes ?? r.month ?? ''),
          categoria: String(r.categoria ?? r.category ?? ''),
          total: Number(r.total ?? r.Total ?? 0),
        })) : [];
        const normExp = Array.isArray(exp) ? exp.map(r => ({
          mes: String(r.mes ?? r.Mes ?? r.month ?? ''),
          categoria: String(r.categoria ?? r.category ?? ''),
          total: Number(r.total ?? r.Total ?? 0),
        })) : [];

        setRowsIncome(normInc);
        setRowsExpense(normExp);

        const months = uniqueMonths(normInc, normExp);
        setSelectedMonth(prev => prev ?? (months[months.length - 1] || currentMonthKey()));
      } catch (e) {
        Alert.alert('Error', toMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const months = useMemo(() => uniqueMonths(rowsIncome, rowsExpense), [rowsIncome, rowsExpense]);
  const monthIdx = Math.max(0, months.findIndex(m => m === selectedMonth));
  const monthLabel = monthKeyToLabel(selectedMonth);

  const incomeByCat = useMemo(
    () => rowsIncome.filter(r => r.mes === selectedMonth).map(r => ({ category: r.categoria, amount: r.total })),
    [rowsIncome, selectedMonth]
  );
  const expenseByCat = useMemo(
    () => rowsExpense.filter(r => r.mes === selectedMonth).map(r => ({ category: r.categoria, amount: r.total })),
    [rowsExpense, selectedMonth]
  );

  const incomeTotal  = useMemo(() => sum(incomeByCat), [incomeByCat]);
  const expenseTotal = useMemo(() => sum(expenseByCat), [expenseByCat]);

  const incomeData  = useMemo(() => toPieData(incomeByCat), [incomeByCat]);
  const expenseData = useMemo(() => toPieData(expenseByCat), [expenseByCat]);
  const generalData = useMemo(
    () => [
      { value: Math.max(incomeTotal, 0),  color: '#3DBE7A', text: 'Ingresos' },
      { value: Math.max(expenseTotal, 0), color: '#E76E6E', text: 'Gastos'   },
    ],
    [incomeTotal, expenseTotal]
  );

  const currentData  = mode === 'income' ? incomeData : mode === 'expense' ? expenseData : generalData;
  const currentTotal = mode === 'income' ? incomeTotal : mode === 'expense' ? expenseTotal : (incomeTotal + expenseTotal);

  const tableRows = useMemo(() => {
    if (mode === 'income')  return incomeByCat.map(x => ({ category: x.category, income: x.amount, expense: 0 }));
    if (mode === 'expense') return expenseByCat.map(x => ({ category: x.category, income: 0,        expense: x.amount }));
    return mergeForGeneral(incomeByCat, expenseByCat);
  }, [mode, incomeByCat, expenseByCat]);

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Gráficas</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Selector de mes */}
      <View style={s.monthBar}>
        <TouchableOpacity
          onPress={() => setSelectedMonth(months[Math.max(0, monthIdx - 1)])}
          disabled={monthIdx <= 0}
          style={[s.monthBtn, monthIdx <= 0 && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={s.monthText}>{loading ? 'Cargando…' : (monthLabel || '—')}</Text>
        <TouchableOpacity
          onPress={() => setSelectedMonth(months[Math.min(months.length - 1, monthIdx + 1)])}
          disabled={monthIdx >= months.length - 1}
          style={[s.monthBtn, monthIdx >= months.length - 1 && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <SegTab label="Ingresos" active={mode==='income'}  onPress={() => setMode('income')} />
        <SegTab label="Gastos"   active={mode==='expense'} onPress={() => setMode('expense')} />
        <SegTab label="General"  active={mode==='general'} onPress={() => setMode('general')} />
      </View>

      {/* Resumen */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Saldo del mes</Text>
        <Text style={s.cardTotal}>${fmt(incomeTotal - expenseTotal)}</Text>

        <View style={s.innerCard}>
          {mode !== 'expense' && (
            <RowIconText icon="arrow-up" text="Ingresos" value={`$${fmt(incomeTotal)}`} valueStyle={s.income} />
          )}
          {mode !== 'income' && (
            <RowIconText icon="arrow-down" text="Gastos" value={`$${fmt(expenseTotal)}`} valueStyle={s.expense} />
          )}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
        <View style={s.chartCard}>
          {currentTotal > 0 ? (
            <PieChart
              data={currentData}
              donut
              radius={100}
              innerRadius={60}
              showText={false}
              focusOnPress
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.centerTop}>Total</Text>
                  <Text style={s.centerAmount}>${fmt(currentTotal)}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={{ color:'#ccc' }}>No hay datos para este mes.</Text>
          )}
        </View>

        {tableRows.map((row, idx) => (
          <View key={`${row.category}-${idx}`} style={s.catRow}>
            <Text style={s.catName}>{row.category}</Text>
            <View style={{ flex: 1 }} />
            <View>
              <Text style={s.income}>${fmt(row.income || 0)}</Text>
              <Text style={s.expense}>${fmt(row.expense || 0)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

/* ---------- UI bits ---------- */
function SegTab({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.tab, active && s.tabActive]} onPress={onPress}>
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function RowIconText({ icon, text, value, valueStyle }) {
  return (
    <View style={s.iconRow}>
      <MaterialIcons name={icon} size={18} color={icon === 'arrow-up' ? '#3DBE7A' : '#E76E6E'} />
      <Text style={s.iconRowLabel}>{text}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[s.iconRowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

/* ---------- helpers ---------- */
function toMsg(e){
  if (typeof e === 'string') return e;
  if (e?.message) return String(e.message);
  try { return JSON.stringify(e); } catch { return 'Error desconocido'; }
}
function sum(arr){ return arr.reduce((a,b)=>a+(Number(b.amount)||0),0); }
function fmt(n){ return Number(n||0).toFixed(2); }
const palette = ['#6FA8DC','#93C47D','#76A5AF','#C9DAF8','#A4C2F4','#9FC5E8','#B4A7D6','#FFD966','#EA9999','#B6D7A8'];
function toPieData(arr){
  return arr
    .filter(x => (Number(x.amount) || 0) > 0)
    .map((x,i)=>({ value:Number(x.amount)||0, color:palette[i%palette.length], text:x.category }));
}
function mergeForGeneral(incomes, expenses){
  const map = new Map();
  incomes.forEach(i => map.set(i.category, { category:i.category, income:i.amount||0, expense:0 }));
  expenses.forEach(e => {
    const cur = map.get(e.category) || { category:e.category, income:0, expense:0 };
    cur.expense = (cur.expense||0) + (e.amount||0);
    map.set(e.category, cur);
  });
  return Array.from(map.values());
}
function uniqueMonths(inc, exp){
  const set = new Set([...(inc||[]).map(r=>r.mes), ...(exp||[]).map(r=>r.mes)]);
  return Array.from(set).filter(Boolean).sort(); // 'YYYY-MM'
}
function currentMonthKey(){
  const d = new Date(); const m = String(d.getMonth()+1).padStart(2,'0'); return `${d.getFullYear()}-${m}`;
}
function monthKeyToLabel(key){
  if(!key) return '';
  const [y,m] = key.split('-').map(x=>Number(x));
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if(!m || !y) return key;
  return `${meses[m-1]} ${y}`;
}

/* ---------- styles ---------- */
const s = StyleSheet.create({
  header:{ paddingTop:18, paddingHorizontal:14, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },

  monthBar:{ marginHorizontal:14, marginTop:6, marginBottom:6, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12 },
  monthBtn:{ width:32, height:32, borderRadius:16, backgroundColor:'#3a3a3c', alignItems:'center', justifyContent:'center' },
  monthText:{ color:'#fff', fontWeight:'700' },

  tabs:{ flexDirection:'row', gap:8, paddingHorizontal:14, marginBottom:8 },
  tab:{ borderWidth:1, borderColor:'#f0b6d6', paddingVertical:8, paddingHorizontal:10, borderRadius:8 },
  tabActive:{ backgroundColor:'rgba(255,255,255,0.08)' },
  tabText:{ color:'#ffe', fontSize:13 },
  tabTextActive:{ fontWeight:'700' },

  card:{ marginHorizontal:14, marginTop:4, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, padding:12, backgroundColor:'rgba(255,255,255,0.04)' },
  cardTitle:{ color:'#fff', opacity:0.9, marginBottom:4 },
  cardTotal:{ color:'#fff', fontSize:28, fontWeight:'800', marginBottom:10 },
  innerCard:{ borderWidth:1, borderColor:'#f0b6d6', borderRadius:12, padding:10 },

  iconRow:{ flexDirection:'row', alignItems:'center', marginVertical:6 },
  iconRowLabel:{ color:'#cfe', marginLeft:8 },
  iconRowValue:{ fontWeight:'700' },
  income:{ color:'#3DBE7A' },
  expense:{ color:'#E76E6E' },

  chartCard:{ borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, paddingVertical:14, paddingHorizontal:10, backgroundColor:'rgba(255,255,255,0.04)', marginBottom:12, alignItems:'center' },
  centerTop:{ color:'#ddd', fontSize:12 },
  centerAmount:{ color:'#fff', fontSize:18, fontWeight:'800' },

  catRow:{ flexDirection:'row', alignItems:'center', backgroundColor:'#3a3a3c', paddingVertical:10, paddingHorizontal:12, borderRadius:10, marginBottom:8 },
  catName:{ color:'#fff', fontWeight:'700' },
});
