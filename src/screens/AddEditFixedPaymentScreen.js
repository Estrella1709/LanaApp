/**
 * AddEditFixedPaymentScreen
 * -------------------------
 * Pantalla para AGREGAR o EDITAR un "pago fijo".
 *
 * Flujo (demo con estado local):
 *  - Si viene route.params.mode === 'edit' y route.params.payment, precarga los campos.
 *  - Si viene 'add', parte con valores vacíos/por defecto.
 *  - El botón principal llama `save()`:
 *      • DEMO: ejecuta onSave (callback recibido por params) y hace goBack().
 *      • API: reemplazar por POST/PUT al backend (ver marcadores // API: ...).
 *
 * UI:
 *  - Selector de categoría (CategoryPickerModal).
 *  - Input de monto.
 *  - Selector de fecha (DateTimePicker nativo).
 *  - Scroll + KeyboardAvoidingView para un buen comportamiento con teclado.
 *
 * 🔌 Integración con API (marcado con // API: ...):
 *  1) Cargar categorías reales:
 *     - Reemplazar `demoCategories` por datos de backend:
 *       GET /categories?scope=fixedPayments (o el que definas)
 *       Guardarlas en estado y pasarlas al modal.
 *
 *  2) Modo 'edit' (precarga real):
 *     - Si solo viene `payment.id`, hacer GET /fixed-payments/:id para traer datos
 *       más frescos y setear estado (category, amount, date).
 *
 *  3) Guardar:
 *     - ADD:  POST /fixed-payments { category, amount, date }
 *     - EDIT: PUT  /fixed-payments/:id { category, amount, date }
 *     - Al éxito: navigation.goBack() y refrescar la lista en FixedPaymentsScreen
 *       (useFocusEffect con re-fetch, o pasando callback/flag por params).
 *
 *  4) Validación:
 *     - Verificar que category exista, amount > 0 y date válido antes de llamar API.
 */

import { useState /*, useEffect */ } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform,
  KeyboardAvoidingView, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryPickerModal from '../components/CategoryPickerModal';

/** DEMO: categorías mock
 *  // API: reemplazar por categorías reales.
 *  // Sugerencia:
 *  //   useEffect(() => {
 *  //     (async () => {
 *  //       const res = await fetch(`${API_URL}/categories?scope=fixedPayments`);
 *  //       const data = await res.json(); // ['Renta','Internet',...]
 *  //       setCategories(data);
 *  //     })();
 *  //   }, []);
 */
const demoCategories = ['Renta','Internet','Despensa','Servicios','Transporte','Comida'];

export default function AddEditFixedPaymentScreen({ route, navigation }) {
  const { mode = 'add', payment, onSave } = route.params || {};
  const isEdit = mode === 'edit';

  /** Estado del formulario
   *  // API (edit con id): opcionalmente revalidar datos con GET /fixed-payments/:id aquí.
   */
  const [category, setCategory] = useState(payment?.category || 'Renta');
  const [amount, setAmount]     = useState(payment?.amount?.toString() ?? '');
  const [date, setDate]         = useState(payment?.date ? new Date(payment.date) : new Date());

  // Control de modales
  const [showPicker, setShowPicker] = useState(false);
  const [showDate, setShowDate]     = useState(false);

  /** Guardar (demo local con callback onSave)
   *  // API: reemplazar por POST/PUT reales:
   *  //   try {
   *  //     const payload = { category, amount: Number(amount), date: date.toISOString() };
   *  //     if (isEdit) {
   *  //       const res = await fetch(`${API_URL}/fixed-payments/${payment.id}`, {
   *  //         method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload)
   *  //       });
   *  //       if (!res.ok) throw new Error('No se pudo actualizar');
   *  //     } else {
   *  //       const res = await fetch(`${API_URL}/fixed-payments`, {
   *  //         method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload)
   *  //       });
   *  //       if (!res.ok) throw new Error('No se pudo crear');
   *  //     }
   *  //     navigation.goBack();
   *  //   } catch (e) { /* mostrar error en UI */ //}  
  
  const save = () => {
    // Validación mínima (demo)
    const amt = parseFloat(amount || '0');
    const obj = {
      id: payment?.id || String(Date.now()), // API: el id vendrá del backend
      category,
      amount: isNaN(amt) ? 0 : amt,
      date,
    };

    // DEMO: callback local para actualizar la lista en FixedPaymentsScreen
    onSave?.(obj);

    // Vuelta a la lista
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex:1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom:24 }}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>LanaApp - Pagos fijos</Text>
            <Ionicons name="settings-sharp" size={20} color="#cfe" />
          </View>

          {/* Card principal */}
          <View style={s.card}>
            <Text style={s.title}>{isEdit ? 'Editar pago fijo' : 'Agregar pago fijo'}</Text>

            {/* Categoría
               // API: usar lista real de categorías */}
            <Text style={s.label}>Categoría</Text>
            <TouchableOpacity
              style={[s.pill, { backgroundColor:'#8AA2FF' }]}
              onPress={() => setShowPicker(true)}
            >
              <Text style={s.pillText}>{category}</Text>
              <MaterialIcons name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>

            {/* Monto */}
            <Text style={[s.label, { marginTop: 10 }]}>Monto</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="$00.00"
              placeholderTextColor="#bbb"
              style={s.input}
            />

            {/* Fecha */}
            <Text style={[s.label, { marginTop: 10 }]}>Fecha</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setShowDate(true)}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={s.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {/* Guardar */}
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: isEdit ? '#F5A524' : '#8AA2FF' }]}
              onPress={save /* API: reemplazar por versión async con POST/PUT */}
            >
              <Text style={s.primaryText}>{isEdit ? 'Editar' : 'Agregar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de categorías
         // API: pasa aquí las categorías reales obtenidas del backend */}
      <CategoryPickerModal
        visible={showPicker}
        title="Categoría:"
        categories={demoCategories /* API: categorías reales */}
        onClose={() => setShowPicker(false)}
        onSelect={(cat) => setCategory(cat)}
      />

      {/* DatePicker nativo */}
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => { if (d) setDate(d); setShowDate(false); }}
        />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header:{ paddingTop:18,paddingHorizontal:14,paddingBottom:8, flexDirection:'row',justifyContent:'space-between',alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },

  card:{ margin:14, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, padding:16, backgroundColor:'rgba(255,255,255,0.06)' },
  title:{ color:'#fff', fontSize:18, fontWeight:'800', marginBottom:12 },

  label:{ color:'#cfcfd2', marginBottom:6 },

  pill:{ alignSelf:'flex-start', paddingVertical:6, paddingHorizontal:10, borderRadius:8, flexDirection:'row', alignItems:'center', gap:6 },
  pillText:{ color:'#fff', fontWeight:'700' },

  input:{ backgroundColor:'#eee', borderRadius:8, height:40, paddingHorizontal:10, color:'#222' },

  dateBtn:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#3a3a3c', borderRadius:10, paddingVertical:8, paddingHorizontal:12 },
  dateText:{ color:'#fff', fontWeight:'600' },

  primaryBtn:{ alignSelf:'center', paddingVertical:10, paddingHorizontal:22, borderRadius:10, marginTop:16 },
  primaryText:{ color:'#fff', fontWeight:'700' },
});
