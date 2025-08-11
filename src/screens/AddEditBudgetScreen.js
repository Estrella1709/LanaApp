// src/screens/AddEditBudgetScreen.js
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform,
  KeyboardAvoidingView, ScrollView, Alert, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import CategoryPickerModal from '../components/CategoryPickerModal';
import { getCategoriesApi, createBudget, updateBudget } from '../services/api';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function AddEditBudgetScreen({ route, navigation }) {
  const { mode = 'add', budget } = route.params || {};
  const isEdit = mode === 'edit';

  // ---------- Categorías ----------
  const [categories, setCategories] = useState([]);
  const names = useMemo(() => categories.map(c => c.name), [categories]);
  const nameToId = useMemo(() => {
    const m = new Map();
    categories.forEach(c => m.set(c.name, c.id));
    return m;
  }, [categories]);

  // ---------- Form ----------
  const [catName, setCatName] = useState('');
  const [catId, setCatId]     = useState(null);
  const [amount, setAmount]   = useState(budget ? String(budget.amount ?? '') : '');
  const [monthName, setMonthName] = useState(
    budget ? MONTHS[(Number(budget.month) || 1) - 1] : MONTHS[new Date().getMonth()]
  );

  // Pickers
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getCategoriesApi();
        const norm = Array.isArray(list)
          ? list.map(x => ({
              id: x.id ?? x.ID ?? x.Id ?? x.id_category ?? x.idCategory,
              name: x.name ?? x.Nombre ?? x.nombre ?? `${x.id}`
            })).filter(c => c.id != null)
          : [];
        setCategories(norm);

        // Precarga categoría si venía en el budget; si no, primera de la lista
        if (budget?.category != null) {
          const found = norm.find(c => String(c.id) === String(budget.category));
          setCatName(found?.name || norm[0]?.name || '');
          setCatId(found?.id ?? norm[0]?.id ?? null);
        } else {
          setCatName(norm[0]?.name || '');
          setCatId(norm[0]?.id ?? null);
        }
      } catch {
        // Si falla la carga, el guardado te avisará que selecciones categoría
      }
    })();
  }, [budget]);

  const save = async () => {
    const amt = parseFloat(amount || '0');
    if (!(amt > 0)) return Alert.alert('Ups', 'Ingresa un monto mayor a 0.');

    const chosenId = catId ?? nameToId.get(catName);
    if (!chosenId) return Alert.alert('Ups', 'Selecciona una categoría.');

    const monthIndex = MONTHS.findIndex(m => m === monthName);
    const month = monthIndex >= 0 ? monthIndex + 1 : 1;

    try {
      setSaving(true);
      const body = { amount: amt, month, category: Number(chosenId) };
      if (isEdit) await updateBudget(budget.id, body);
      else await createBudget(body);

      Alert.alert('OK', isEdit ? 'Presupuesto actualizado' : 'Presupuesto creado');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo guardar el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex:1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom:24 }}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>LanaApp - Presupuestos</Text>
            <Ionicons name="settings-sharp" size={20} color="#cfe" />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>{isEdit ? 'Editar presupuesto' : 'Agregar presupuesto'}</Text>

            {/* Categoría */}
            <Text style={s.label}>Categoría</Text>
            <TouchableOpacity style={[s.pill, { backgroundColor:'#8AA2FF' }]} onPress={() => setShowCatPicker(true)}>
              <Text style={s.pillText}>{catName || 'Selecciona'}</Text>
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

            {/* Mes (solo mes, sin año) */}
            <Text style={[s.label, { marginTop: 10 }]}>Mes</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setShowMonthPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={s.dateText}>{monthName}</Text>
            </TouchableOpacity>

            {/* Guardar */}
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: isEdit ? '#F5A524' : '#8AA2FF', opacity: saving ? 0.6 : 1 }]}
              onPress={save}
              disabled={saving}
            >
              <Text style={s.primaryText}>{isEdit ? 'Guardar cambios' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker de Categoría */}
      <CategoryPickerModal
        visible={showCatPicker}
        title="Categoría:"
        categories={names.length ? names : ['General']}
        onClose={() => setShowCatPicker(false)}
        onSelect={(name) => {
          setCatName(name);
          setCatId(nameToId.get(name) ?? null);
        }}
      />

      {/* Picker simple de Mes */}
      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Selecciona el mes</Text>
            <View style={{ gap: 8 }}>
              {MONTHS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={s.monthItem}
                  onPress={() => { setMonthName(m); setShowMonthPicker(false); }}
                >
                  <Text style={{ color:'#fff', fontWeight:'700' }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.modalBtn, s.btnCancel, { marginTop: 12, alignSelf:'center' }]}
              onPress={() => setShowMonthPicker(false)}
            >
              <Text style={s.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  backdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center' },
  modalBox:{ width:280, borderRadius:12, borderWidth:1, borderColor:'#f0b6d6', backgroundColor:'rgba(40,40,42,0.98)', padding:16 },
  modalTitle:{ color:'#fff', fontWeight:'700', marginBottom:12, textAlign:'center' },
  monthItem:{ backgroundColor:'#3a3a3c', borderRadius:8, paddingVertical:10, paddingHorizontal:12 },
  modalBtn:{ borderRadius:8, paddingVertical:8, paddingHorizontal:18 },
  btnCancel:{ backgroundColor:'#cfaed3' }, btnCancelText:{ color:'#2b2b2e', fontWeight:'700' },
});
