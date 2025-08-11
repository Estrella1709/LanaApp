/**
 * ChartsScreen
 * ------------
 * Pantalla de **gráficas** con 3 modos:
 *   - Ingresos por categoría
 *   - Gastos por categoría
 *   - General (Ingresos vs Gastos)
 *
 * Qué muestra:
 *  - Tarjeta superior con resumen del mes (saldo = ingresos - gastos).
 *  - Pie/donut chart con los datos del modo seleccionado.
 *  - Lista por categoría con montos (y en modo general, ambas columnas).
 *
 * 🔌 Integración con API (marcado con // API: ...):
 *  1) Origen de datos:
 *     - Reemplazar `mockIncome` y `mockExpense` por datos reales del backend.
 *       Ejemplos de endpoints:
 *         GET /reports/income-by-category?month=YYYY-MM
 *         GET /reports/expense-by-category?month=YYYY-MM
 *       Respuesta esperada (forma conveniente):
 *         [{ category: 'Salario', amount: 1200 }, ...]
 *
 *  2) Carga/Refresco:
 *     - Añadir un estado `selectedMonth` y un `useEffect`/`useFocusEffect` que:
 *         a) haga fetch de ingresos/gastos por categoría del mes seleccionado
 *         b) setee estados locales para los arreglos (reemplazando los mocks)
 *
 *  3) Totales:
 *     - Se calculan con `sum(...)` a partir de las listas por categoría.
 *       También podrías traerlos directos de:
 *         GET /reports/summary?month=YYYY-MM -> { incomeTotal, expenseTotal }
 *
 *  4) Errores/Loading:
 *     - Añadir estados `loading`/`error` y placeholders si la API tarda o falla.
 *
 *  5) Colores/Accesibilidad:
 *     - La paleta local `palette` se usa para los segmentos de categorías.
 *       Si tu API devuelve IDs de categoría, puedes mapear colores consistentes.
 */

import { useMemo, useState /*, useEffect */ } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

/** DEMO: datos mock
 *  // API: reemplazar por datos reales traídos del servidor (ver arriba).
 *  // Ej. const [incomeRows, setIncomeRows] = useState([]); y setear en useEffect.
 */
const mockIncome = [
  { category: 'Salario', amount: 1200 },
  { category: 'Renta', amount: 200 },
  { category: 'Intereses', amount: 100 },
  { category: 'Otros', amount: 50 },
];
const mockExpense = [
  { category: 'Comida', amount: 450 },
  { category: 'Servicios', amount: 220 },
  { category: 'Transporte', amount: 120 },
  { category: 'Entretenimiento', amount: 80 },
];

export default function ChartsScreen() {
  /** UI: modo de gráfica actual */
  const [mode, setMode] = useState('income'); // 'income' | 'expense' | 'general'

  /** Totales (derivados de los arreglos) */
  const incomeTotal  = useMemo(() => sum(mockIncome), []);
  const expenseTotal = useMemo(() => sum(mockExpense), []);

  /** Datos para el PieChart (convertidos a formato de gifted-charts) */
  const incomeData   = useMemo(() => toPieData(mockIncome), []);
  const expenseData  = useMemo(() => toPieData(mockExpense), []);
  const generalData  = useMemo(
    () => [
      { value: incomeTotal,  color: '#3DBE7A', text: 'Ingresos' },
      { value: expenseTotal, color: '#E76E6E', text: 'Gastos'   },
    ],
    [incomeTotal, expenseTotal]
  );

  /** Selección de dataset y total según el modo */
  const currentData  = mode === 'income' ? incomeData : mode === 'expense' ? expenseData : generalData;
  const currentTotal = mode === 'income' ? incomeTotal : mode === 'expense' ? expenseTotal : incomeTotal + expenseTotal;

  /** API: carga inicial (ejemplo)
   *  // const [incomeRows, setIncomeRows] = useState([]);
   *  // const [expenseRows, setExpenseRows] = useState([]);
   *  // useEffect(() => {
   *  //   (async () => {
   *  //     const r1 = await fetch(`${API_URL}/reports/income-by-category?month=${selectedMonth}`);
   *  //     const inc = await r1.json();
   *  //     const r2 = await fetch(`${API_URL}/reports/expense-by-category?month=${selectedMonth}`);
   *  //     const exp = await r2.json();
   *  //     setIncomeRows(inc); setExpenseRows(exp);
   *  //   })();
   *  // }, [selectedMonth]);
   */

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Gráficas</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Tabs de modo */}
      <View style={s.tabs}>
        <SegTab label="Ingresos" active={mode==='income'}  onPress={() => setMode('income')} />
        <SegTab label="Gastos"   active={mode==='expense'} onPress={() => setMode('expense')} />
        <SegTab label="General"  active={mode==='general'} onPress={() => setMode('general')} />
      </View>

      {/* Resumen superior */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Presupuesto Total del mes</Text>
        <Text style={s.cardTotal}>${fmt(incomeTotal - expenseTotal)}</Text>

        <View style={s.innerCard}>
          {/* Mostrar solo las filas que aplican al modo */}
          {mode !== 'expense' && (
            <RowIconText
              icon="arrow-up"
              text="Ingresos"
              value={`$${fmt(incomeTotal)}`}
              valueStyle={s.income}
            />
          )}
          {mode !== 'income' && (
            <RowIconText
              icon="arrow-down"
              text="Gastos"
              value={`$${fmt(expenseTotal)}`}
              valueStyle={s.expense}
            />
          )}
        </View>
      </View>

      {/* Contenido scrolleable: Pie + lista por categoría */}
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
        {/* Donut chart */}
        <View style={s.chartCard}>
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
        </View>

        {/* Tabla simple por categoría
           // API: reemplazar los map(...) por los arreglos reales que vengas usando */}
        {(mode === 'income'
          ? mockIncome.map(x => ({ category: x.category, income: x.amount, expense: 0 }))
          : mode === 'expense'
          ? mockExpense.map(x => ({ category: x.category, income: 0, expense: x.amount }))
          : mergeForGeneral(mockIncome, mockExpense)
        ).map((row, idx) => (
          <View key={idx} style={s.catRow}>
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

/** Botón/Segmento de modo */
function SegTab({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.tab, active && s.tabActive]} onPress={onPress}>
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Fila de totales con icono */
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

/** Utils */
function sum(arr) { return arr.reduce((a, b) => a + (Number(b.amount) || 0), 0); }
function fmt(n) { return Number(n).toFixed(2); }
const palette = ['#6FA8DC', '#93C47D', '#76A5AF', '#C9DAF8', '#A4C2F4', '#9FC5E8', '#B4A7D6'];
function toPieData(arr) {
  return arr.map((x, i) => ({
    value: Number(x.amount) || 0,
    color: palette[i % palette.length],
    text: x.category
  }));
}
/** Une ingresos y gastos por categoría para el modo General */
function mergeForGeneral(incomes, expenses) {
  const map = new Map();
  incomes.forEach(i => map.set(i.category, { category: i.category, income: i.amount || 0, expense: 0 }));
  expenses.forEach(e => {
    const cur = map.get(e.category) || { category: e.category, income: 0, expense: 0 };
    cur.expense = (cur.expense || 0) + (e.amount || 0);
    map.set(e.category, cur);
  });
  return Array.from(map.values());
}

const s = StyleSheet.create({
  header:{ paddingTop:18, paddingHorizontal:14, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },

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
