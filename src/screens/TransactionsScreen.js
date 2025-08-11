/**
 * TransactionsScreen
 * ------------------
 * Pantalla principal de transacciones.
 *
 * Qué hace:
 *  - Muestra tarjetas con Totales del mes (presupuesto / ingresos / gastos).
 *  - Lista el historial de transacciones agrupadas por día.
 *  - Cada día se puede expandir/cerrar para ver detalles (categoría y descripción).
 *  - Cada fila de día acepta gesto "swipe" a la izquierda para mostrar acciones:
 *      • Editar  -> navega a AddEditTransaction (por ahora sin ID real)
 *      • Borrar  -> navega a DeleteTransaction (confirmación)
 *  - FAB con speed dial:
 *      • Flecha ↑ agrega Ingreso
 *      • Flecha ↓ agrega Gasto
 *
 * Dónde se conecta con la API (marcado con // API: ...):
 *  1) Carga de datos del mes seleccionado:
 *     - Reemplazar mockData con datos reales; usar useEffect/useFocusEffect para
 *       llamar GET /transactions?month=YYYY-MM (o el endpoint que definas).
 *  2) Totales:
 *     - Calcular a partir de las transacciones cargadas o traerlos de
 *       un endpoint agregado (ej. GET /stats/monthly?month=YYYY-MM).
 *  3) Editar:
 *     - Al navegar a AddEditTransaction, pasar el ID real de la transacción (si corresponde),
 *       y refrescar la lista al volver (o escuchar un evento).
 *  4) Eliminar:
 *     - En vez de navegar a otra screen, puedes lanzar un modal local y,
 *       al confirmar, llamar DELETE /transactions/:id y refrescar lista/totales.
 *  5) Crear:
 *     - Al volver desde AddEditTransaction (modo 'add'), refrescar las transacciones.
 *
 * Notas de UX/Perf:
 *  - FlatList usado para rendimiento en listas grandes.
 *  - LayoutAnimation habilitado para animar expand/collapse.
 *  - Swipeable requiere react-native-gesture-handler.
 *  - Si la API entrega muchos días vacíos, filtra en el servidor o en cliente.
 */

import 'react-native-gesture-handler';
import { useState, useMemo /*, useEffect */ } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  LayoutAnimation, UIManager, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Datos demo (reemplazar con datos reales de la API) */
// API: Este array debería venir de GET /transactions?month=YYYY-MM
const mockData = [
  {
    id: '2025-05-26',
    weekday: 'Lunes',
    income: 0,
    expense: 0,
    items: [
      { id: 'e1', type: 'expense', category: 'Comida', amount: 0, description: 'Descripción del gasto, en caso de que sea muy largo se verá así' },
      { id: 'i1', type: 'income', category: 'Salario', amount: 0, description: 'Descripción del ingreso' },
    ],
  },
  { id: '2025-05-24-1', weekday: 'Sábado', income: 0, expense: 0, items: [] },
  { id: '2025-05-24-2', weekday: 'Sábado', income: 0, expense: 0, items: [] },
];

export default function TransactionsScreen({ navigation }) {
  /** Estado de UI */
  const [expanded, setExpanded] = useState({});   // controla qué días están abiertos
  const [speedDial, setSpeedDial] = useState(false);

  /** Totales del mes (demo)
   *  API: Calcula a partir de las transacciones o trae de /stats/monthly
   *  Ejemplo:
   *    const totals = useMemo(() => calcTotals(transactions), [transactions]);
   */
  const totals = useMemo(() => ({ income: 0, expense: 0, budget: 0 }), []);

  /** Cargar datos al montar o al cambiar de mes
   *  API: Descomentar y traer datos reales
   *  useEffect(() => {
   *    (async () => {
   *      const res = await fetch(`${API_URL}/transactions?month=${selectedMonth}`);
   *      const data = await res.json();
   *      setTransactions(data);
   *    })();
   *  }, [selectedMonth]);
   */

  /** Expandir/cerrar una fila de día */
  const toggle = (id) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  /** Acciones de swipe de cada fila (editar / borrar)
   *  API (Editar): navegar pasando el id real y refrescar al volver.
   *  API (Borrar): idealmente hacer DELETE directo y refrescar lista/totales.
   */
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

  /** Render de cada grupo de día */
  const renderRow = ({ item }) => {
    const open = !!expanded[item.id];
    // Notas: aquí se muestran solo el primer gasto/ingreso a modo demo
    // API: Si el día tiene múltiples items, puedes listarlos todos en el bloque expandido.
    const exp = item.items.find(x => x.type === 'expense');
    const inc = item.items.find(x => x.type === 'income');

    // API (Editar): pasa el id del item seleccionado (o del "day item") para editar
    const handleEdit = () => navigation.navigate('AddEditTransaction', {
      mode: 'edit',
      // id: exp?.id || inc?.id, // ← cuando tengas backend
    });

    // API (Borrar): idealmente llamar DELETE /transactions/:id y luego refrescar
    const handleDelete = () => navigation.navigate('DeleteTransaction', {
      id: item.id, // ← placeholder; usa el ID real del item a borrar
    });

    return (
      <Swipeable renderRightActions={() => <RightActions onEdit={handleEdit} onDelete={handleDelete} />}>
        <View style={styles.rowContainer}>
          {/* Cabecera del día (tap para expandir/cerrar) */}
          <TouchableOpacity style={styles.rowHeader} onPress={() => toggle(item.id)}>
            <View>
              <Text style={styles.rowDayNum}>{getDayNumber(item.id)}</Text>
              <Text style={styles.rowWeekday}>{item.weekday}</Text>
            </View>
            <View style={styles.rowAmounts}>
              {/* API: aquí puedes mostrar $ ingresos/gastos del día (sumados) */}
              <Text style={styles.income}>$00.00</Text>
              <Text style={styles.expense}>$00.00</Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} style={{ marginLeft: 6 }} color="#aab" />
            </View>
          </TouchableOpacity>

          {/* Detalle expandible del día */}
          {open && (
            <View style={styles.rowDetails}>
              {/* Gasto */}
              <View style={styles.detailBlock}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Tipo de gasto</Text>
                  <Text style={[styles.detailValue, styles.expense]}>{exp?.category ?? '—'}</Text>
                </View>
                {!!exp?.description && <Text style={styles.detailDesc}>{exp.description}</Text>}
              </View>

              <View style={styles.divider} />

              {/* Ingreso */}
              <View style={styles.detailBlock}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Tipo de ingreso</Text>
                  <Text style={[styles.detailValue, styles.income]}>{inc?.category ?? '—'}</Text>
                </View>
                {!!inc?.description && <Text style={styles.detailDesc}>{inc.description}</Text>}
              </View>
            </View>
          )}
        </View>
      </Swipeable>
    );
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      {/* Header simple (config/ajustes en la derecha) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LanaApp - Transacciones</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Tabs para navegar a otras secciones */}
      <View style={styles.tabs}>
        <TabButton label="Categorías" onPress={() => navigation.navigate('Categories')} />
        <TabButton label="Pagos fijos" onPress={() => navigation.navigate('FixedPayments')} />
        <TabButton label="Gráficas" onPress={() => navigation.navigate('Charts')} />
      </View>

      {/* Card de totales del mes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Presupuesto Total del mes</Text>
        {/* API: Si tienes presupuesto del mes, muéstralo aquí */}
        <Text style={styles.cardTotal}>$00.00</Text>

        <View style={styles.innerCard}>
          {/* API: Reemplaza con valores reales (totals.income / totals.expense) */}
          <RowIconText icon="arrow-up" text="Ingresos" value="$00.00" valueStyle={styles.income} />
          <RowIconText icon="arrow-down" text="Gastos" value="$00.00" valueStyle={styles.expense} />
        </View>

        {/* Navega a pantalla de presupuestos */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('SetBudget')}>
          <Text style={styles.primaryBtnText}>Establecer presupuestos</Text>
        </TouchableOpacity>
      </View>

      {/* Sección del historial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de transacciones</Text>

        {/* Selector de mes (placeholder)
           API: abre un DatePicker/Modal para elegir mes y refrescar lista
        */}
        <TouchableOpacity style={styles.monthPicker}>
          <Ionicons name="calendar-outline" size={16} color="#cfe" />
          <Text style={styles.monthPickerText}>Mayo - 2025</Text>
        </TouchableOpacity>

        {/* Lista virtualizada de días */}
        <FlatList
          data={mockData}                              // API: transactions del servidor
          keyExtractor={(it) => it.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: 120 }} // espacio para no tapar por el FAB
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* FAB con speed dial para agregar ingreso/gasto */}
      <View style={styles.fabContainer}>
        {speedDial && (
          <View style={styles.speedDial}>
            {/* Agregar ingreso */}
            <TouchableOpacity
              style={[styles.dialBtn, { backgroundColor: '#3DBE7A' }]}
              onPress={() => {
                setSpeedDial(false);
                // API (Crear): al volver de AddEditTransaction modo 'add', refrescar lista
                navigation.navigate('AddEditTransaction', { mode: 'add', kind: 'income' });
              }}
            >
              <MaterialIcons name="arrow-upward" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Agregar gasto */}
            <TouchableOpacity
              style={[styles.dialBtn, { backgroundColor: '#E76E6E' }]}
              onPress={() => {
                setSpeedDial(false);
                // API (Crear): idem arriba
                navigation.navigate('AddEditTransaction', { mode: 'add', kind: 'expense' });
              }}
            >
              <MaterialIcons name="arrow-downward" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Botón principal que abre/cierra el speed dial */}
        <TouchableOpacity style={styles.fab} onPress={() => setSpeedDial((s) => !s)} activeOpacity={0.9}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/** Extra: util para obtener el número de día a partir del id del grupo
 *  (si en backend cambias el formato, ajusta esta función)
 */
function getDayNumber(id) {
  const m = id.match(/-(\d{2})(?:$|-\d)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Botón de tab simple */
function TabButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text style={styles.tabText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Fila con ícono + etiqueta + valor (para totales) */
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
  detailBlock:{ paddingVertical:6 },
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
