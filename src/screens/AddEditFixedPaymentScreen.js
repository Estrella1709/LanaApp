import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform,
  KeyboardAvoidingView, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryPickerModal from '../components/CategoryPickerModal';

import {
  apiFetch,               // para /categories/
  createFixedPayment,
  updateFixedPayment,
} from '../services/api';

const FALLBACK_CATS = [
  { id: 1, name: 'Renta' },
  { id: 2, name: 'Internet' },
  { id: 3, name: 'Despensa' },
  { id: 4, name: 'Servicios' },
  { id: 5, name: 'Transporte' },
];

export default function AddEditFixedPaymentScreen({ route, navigation }) {
  const { mode = 'add', payment } = route.params || {};
  const isEdit = mode === 'edit';
  const [pickCat, setPickCat] = useState(false);

  // categorías reales
  const [categories, setCategories] = useState(FALLBACK_CATS);
  useEffect(() => {
    (async () => {
      try {
        const cats = await apiFetch('/categories/');
        if (Array.isArray(cats) && cats.length) {
          const norm = cats.map(x => ({
            id: x.id ?? x.ID ?? x.Id ?? x.id_category ?? x.idCategory ?? x.id,
            name: x.name ?? x.Nombre ?? x.nombre ?? `${x.id}`,
          }));
          setCategories(norm);
        }
      } catch { /* fallback */ }
    })();
  }, []);

  const names = useMemo(() => categories.map(c => c.name), [categories]);
  const nameToId = useMemo(() => {
    const m = new Map(); categories.forEach(c => m.set(c.name, c.id)); return m;
  }, [categories]);
  const idToName = useMemo(() => {
    const m = new Map(); categories.forEach(c => m.set(c.id, c.name)); return m;
  }, [categories]);

  // form state
  const [categoryName, setCategoryName] = useState(
    payment ? (idToName.get(payment.category) || names[0] || 'Renta') : (names[0] || 'Renta')
  );
  const [amount, setAmount] = useState(payment?.amount != null ? String(payment.amount) : '');
  const [description, setDescription] = useState(payment?.description || '');

  // una sola fecha (de ahí sacamos day)
  const [date, setDate] = useState(() => {
    if (payment?.day) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), Number(payment.day));
    }
    return new Date();
  });

  const [pickDay, setPickDay] = useState(false);
  const [saving, setSaving] = useState(false);

  const parseMoney = (s) => {
    const n = parseFloat(String(s).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const onSave = async () => {
    try {
      const amt = parseMoney(amount);
      if (!amt || amt <= 0) throw new Error('Monto inválido.');
      const catId = nameToId.get(categoryName);
      if (!catId) throw new Error('Selecciona una categoría.');

      const day = date.getDate();
      // si ya tiene time, lo respetamos; si no, generamos hora actual
      const timeIso = payment?.time || new Date().toISOString().split('T')[1]; // "HH:MM:SS.mmmZ"

      const payload = {
        amount: amt,
        day,
        time: timeIso,
        description: description || '',
        category: catId,
      };

      setSaving(true);
      if (isEdit && payment?.id) {
        await updateFixedPayment(payment.id, payload);
      } else {
        await createFixedPayment(payload);
      }

      Alert.alert('OK', isEdit ? 'Pago fijo actualizado' : 'Pago fijo creado');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex:1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom:24 }}>
          <View style={s.header}>
            <Text style={s.headerTitle}>LanaApp - Pagos fijos</Text>
            <Ionicons name="settings-sharp" size={20} color="#cfe" />
          </View>

          <View style={s.card}>
            <Text style={s.title}>{isEdit ? 'Editar pago fijo' : 'Agregar pago fijo'}</Text>

            {/* Categoría */}
            <Text style={s.label}>Categoría</Text>
            <TouchableOpacity style={[s.pill, { backgroundColor:'#8AA2FF' }]} onPress={() => setPickCat(true)}>
              <Text style={s.pillText}>{categoryName}</Text>
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

            {/* Descripción */}
            <Text style={[s.label, { marginTop: 10 }]}>Descripción (opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ej. Renta depto"
              placeholderTextColor="#bbb"
              style={s.input}
            />

            {/* Fecha (de aquí sacamos day) */}
            <Text style={[s.label, { marginTop: 10 }]}>Fecha</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setPickDay(true)}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={s.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: isEdit ? '#F5A524' : '#8AA2FF', opacity: saving ? 0.6 : 1 }]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={s.primaryText}>{isEdit ? 'Guardar cambios' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker categorías */}
      <CategoryPickerModal
        visible={pickCat}
        title="Categoría:"
        categories={names.length ? names : FALLBACK_CATS.map(c => c.name)}
        onClose={() => setPickCat(false)}
        onSelect={(name) => setCategoryName(name)}
      />

      {/* DatePicker */}
      {pickDay && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => { if (d) setDate(d); setPickDay(false); }}
        />
      )}
    </LinearGradient>
  );
}

/* estilos */
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
