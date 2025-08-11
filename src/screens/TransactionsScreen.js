// src/screens/TransactionsScreen.js
import 'react-native-gesture-handler';
import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  LayoutAnimation, UIManager, Platform, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { listTransactions, deleteTransaction, getCategoriesApi } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsScreen({ navigation }) {
  const [expanded, setExpanded] = useState({});
  const [speedDial, setSpeedDial] = useState(false);
  const [days, setDays] = useState([]);  
  const [loading, setLoading] = useState(false);
  const [catMap, setCatMap] = useState({}); 

  // Mes actual
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);

  const monthLabel = useMemo(() => {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${meses[selMonth - 1]} ${selYear}`;
  }, [selMonth, selYear]);

  const load = async () => {
    try {
      setLoading(true);
      // 1) Traer categorías y construir el mapa id -> nombre
      const cats = await getCategoriesApi().catch(() => []);
      const map = {};
      (Array.isArray(cats) ? cats : []).forEach(c => {
      const id = c.id ?? c.ID ?? c.Id ?? c.id_category ?? c.idCategory;
      const name = c.name ?? c.Nombre ?? c.nombre ?? `Cat ${id}`;
       if (id != null) map[id] = name;
     });
     setCatMap(map);
      const rows = await listTransactions(); // [{id, amount, datetime, description, category}]
      const filtered = rows.filter(r => {
        const d = new Date(r.datetime);
        return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
      });
      const grouped = groupByDay(filtered, map);
      setDays(grouped);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [selYear, selMonth]));

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    days.forEach(d => { income += d.income; expense += d.expense; });
    return { income, expense, budget: 0 };
  }, [days]);

  const toggle = (id) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(p => ({ ...p, [id]: !p[id] }));
  };

  const RightActions = ({ onEdit, onDelete }) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F5A524' }]} onPress={onEdit}>
        <Text style={styles.actionText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E5484D' }]} onPress={onDelete}>
        <Text style={styles.actionText}>Borrar</Text>
      </TouchableOpacity>
    </View>
  );

  const onEditDay = (dayItem) => {
    // Tomamos el primer ingreso y el primer gasto del día (si hay varios, luego lo refinamos)
    const incomeTx  = dayItem.items.find(t => Number(t.amount) >= 0) || null;
    const expenseTx = dayItem.items.find(t => Number(t.amount) < 0)  || null;

    // Abrimos pantalla que permite editar ambos, sin obligar a llenar los dos
    navigation.navigate('AddEditTransaction', {
      mode: 'edit',
      kind: 'both',
      income: incomeTx ? {
        id: incomeTx.id,
        amount: Math.abs(Number(incomeTx.amount) || 0),
        datetime: incomeTx.datetime,
        description: incomeTx.description,
        category: incomeTx.category,
        categoryName: incomeTx.categoryName,
      } : null,
      expense: expenseTx ? {
        id: expenseTx.id,
        amount: Math.abs(Number(expenseTx.amount) || 0),
        datetime: expenseTx.datetime,
        description: expenseTx.description,
        category: expenseTx.category,
        categoryName: expenseTx.categoryName,
      } : null,
    });
  };

  const onDeleteDay = (dayItem) => {
    const incomeTx  = dayItem.items.find(t => Number(t.amount) >= 0);
    const expenseTx = dayItem.items.find(t => Number(t.amount) < 0);

    if (incomeTx && expenseTx) {
      Alert.alert('Eliminar', '¿Qué deseas eliminar?', [
        { text: 'Ingreso', onPress: async () => { await doDelete(incomeTx.id); } },
        { text: 'Gasto',   onPress: async () => { await doDelete(expenseTx.id); } },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      const tx = incomeTx || expenseTx;
      if (!tx?.id) return Alert.alert('Ups', 'No hay ID para eliminar.');
      Alert.alert('Eliminar', '¿Seguro que quieres eliminar esta transacción?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => { await doDelete(tx.id); } },
      ]);
    }
  };

  const doDelete = async (id) => {
    try {
      await deleteTransaction(id);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo eliminar');
    }
  };

  const renderRow = ({ item }) => {
    const open = !!expanded[item.id];
    return (
      <Swipeable renderRightActions={() => <RightActions onEdit={() => onEditDay(item)} onDelete={() => onDeleteDay(item)} />}>
        <View style={styles.rowContainer}>
          {/* Cabecera del día (tap para expandir/cerrar) */}
          <TouchableOpacity style={styles.rowHeader} onPress={() => toggle(item.id)}>
            <View>
              <Text style={styles.rowDayNum}>{item.day}</Text>
              <Text style={styles.rowWeekday}>{item.weekday}</Text>
            </View>
            <View style={styles.rowAmounts}>
              <Text style={styles.income}>${fmt(item.income)}</Text>
              <Text style={styles.expense}>${fmt(item.expense)}</Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} style={{ marginLeft: 6 }} color="#aab" />
            </View>
          </TouchableOpacity>

          {open && (
            <View style={styles.rowDetails}>
              {item.items.map(tx => {
                const isExpense = Number(tx.amount) < 0;
                return (
                  <View key={tx._key} style={{ marginBottom: 10 }}>
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailTitle}>
                        {isExpense ? 'Gasto' : 'Ingreso'} • ${fmt(Math.abs(tx.amount))}
                      </Text>
                      <Text style={[styles.detailValue, isExpense ? styles.expense : styles.income]}>
                       {catMap[tx.category] ?? tx.categoryName ?? `Cat ${tx.category}`}
                      </Text>
                    </View>
                    {!!tx.description && <Text style={styles.detailDesc}>{tx.description}</Text>}
                    <View style={styles.divider} />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Swipeable>
    );
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LanaApp - Transacciones</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      <View style={styles.tabs}>
        <TabButton label="Categorías" onPress={() => navigation.navigate('Categories')} />
        <TabButton label="Pagos fijos" onPress={() => navigation.navigate('FixedPayments')} />
        <TabButton label="Gráficas" onPress={() => navigation.navigate('Charts')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Presupuesto Total del mes</Text>
        <Text style={styles.cardTotal}>$00.00</Text>

        <View style={styles.innerCard}>
          <RowIconText icon="arrow-up" text="Ingresos" value={`$${fmt(totals.income)}`} valueStyle={styles.income} />
          <RowIconText icon="arrow-down" text="Gastos" value={`$${fmt(totals.expense)}`} valueStyle={styles.expense} />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('SetBudget')}>
          <Text style={styles.primaryBtnText}>Establecer presupuestos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{loading ? 'Cargando...' : 'Historial de transacciones'}</Text>

        <View style={styles.monthPicker}>
          <Ionicons name="calendar-outline" size={16} color="#cfe" />
          <Text style={styles.monthPickerText}>{monthLabel}</Text>
        </View>

        <FlatList
          data={days}
          keyExtractor={(it) => it.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.fabContainer}>
        {speedDial && (
          <View style={styles.speedDial}>
            <TouchableOpacity
              style={[styles.dialBtn, { backgroundColor: '#3DBE7A' }]}
              onPress={() => {
                setSpeedDial(false);
                navigation.navigate('AddEditTransaction', { mode: 'add', kind: 'income' });
              }}
            >
              <MaterialIcons name="arrow-upward" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialBtn, { backgroundColor: '#E76E6E' }]}
              onPress={() => {
                setSpeedDial(false);
                navigation.navigate('AddEditTransaction', { mode: 'add', kind: 'expense' });
              }}
            >
              <MaterialIcons name="arrow-downward" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setSpeedDial((s) => !s)} activeOpacity={0.9}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* ---- helpers ---- */
function groupByDay(rows, catMap = {}) {
  const map = new Map();
  rows.forEach((tx, idx) => {
    const dt = new Date(tx.datetime);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const entry = map.get(key) || {
      id: key,
      day: String(d).padStart(2,'0'),
      weekday: weekdayName(y, m, d),
      income: 0,
      expense: 0,
      items: []
    };
    const amount = Number(tx.amount);
    const isExpense = amount < 0;
    const abs = Math.abs(amount);
    entry[isExpense ? 'expense' : 'income'] += abs;
    entry.items.push({
      _key: `${key}-${idx}`,
      id: tx.id,
      amount,
      description: tx.description,
      category: tx.category,
      categoryName: catMap?.[tx.category] ?? tx.categoryName,
      datetime: tx.datetime,
    });
    map.set(key, entry);
  });
  return Array.from(map.values()).sort((a, b) => (a.id < b.id ? 1 : -1));
}
function weekdayName(y, m, d) {
  const dd = new Date(y, m - 1, d);
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return dias[dd.getDay()];
}
function fmt(n) { return Number(n || 0).toFixed(2); }

/* ---- UI bits ---- */
function TabButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text style={styles.tabText}>{label}</Text>
    </TouchableOpacity>
  );
}
function RowIconText({ icon, text, value, valueStyle }) {
  return (
    <View style={styles.iconRow}>
      <MaterialIcons name={icon} size={18} color={icon === 'arrow-up' ? '#3DBE7A' : '#E76E6E'} />
      <Text style={styles.iconRowLabel}>{text}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.iconRowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

/* ---- estilos ---- */
const styles = StyleSheet.create({
  header:{ paddingTop:18, paddingHorizontal:14, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },
  tabs:{ flexDirection:'row', gap:8, paddingHorizontal:14, marginBottom:8 },
  tab:{ borderWidth:1, borderColor:'#f0b6d6', paddingVertical:8, paddingHorizontal:10, borderRadius:8 },
  tabText:{ color:'#ffe', fontSize:13 },
  card:{ margin:14, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, padding:12, backgroundColor:'rgba(255,255,255,0.04)' },
  cardTitle:{ color:'#fff', opacity:0.9, marginBottom:4 },
  cardTotal:{ color:'#fff', fontSize:28, fontWeight:'800', marginBottom:10 },
  innerCard:{ borderWidth:1, borderColor:'#f0b6d6', borderRadius:12, padding:10, marginBottom:10 },
  iconRow:{ flexDirection:'row', alignItems:'center', marginVertical:6 },
  iconRowLabel:{ color:'#cfe', marginLeft:8 },
  iconRowValue:{ fontWeight:'700' },
  income:{ color:'#3DBE7A' },
  expense:{ color:'#E76E6E' },
  primaryBtn:{ backgroundColor:'#DEB6F8', paddingVertical:10, borderRadius:10, alignItems:'center' },
  primaryBtnText:{ color:'#2b2b2e', fontWeight:'700' },
  section:{ paddingHorizontal:14, marginTop:4 },
  sectionTitle:{ color:'#fff', fontWeight:'700', marginBottom:8 },
  monthPicker:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#3a3a3c', borderRadius:10, paddingVertical:8, paddingHorizontal:10, marginBottom:10 },
  monthPickerText:{ color:'#eaeaea', fontWeight:'600' },
  rowContainer:{ marginBottom:10 },
  rowHeader:{ backgroundColor:'#4a4a4c', borderRadius:12, padding:12, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  rowDayNum:{ color:'#fff', fontSize:20, fontWeight:'800' },
  rowWeekday:{ color:'#cfcfcf' },
  rowAmounts:{ flexDirection:'row', alignItems:'center', gap:8 },
  rowDetails:{ backgroundColor:'#5a5a5c', borderRadius:12, padding:12, marginTop:6 },
  detailHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  detailTitle:{ color:'#eee', fontWeight:'700', fontSize:15 },
  detailValue:{ color:'#fff', fontWeight:'700', fontSize:15 },
  detailDesc:{ color:'#fff', lineHeight:18 },
  divider:{ height:1, backgroundColor:'#8b8b8b', marginVertical:6, opacity:0.5 },
  swipeActions:{ flexDirection:'row', alignItems:'center', marginLeft:8 },
  actionBtn:{ width:80, height:'86%', borderRadius:10, justifyContent:'center', alignItems:'center', marginHorizontal:4 },
  actionText:{ color:'#fff', fontWeight:'700' },
  fabContainer:{ position:'absolute', right:16, bottom:22, alignItems:'center' },
  fab:{ width:56, height:56, borderRadius:28, backgroundColor:'#8AA2FF', justifyContent:'center', alignItems:'center', elevation:6 },
  speedDial:{ alignItems:'center', marginBottom:10, gap:10 },
  dialBtn:{ width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center' },
});
