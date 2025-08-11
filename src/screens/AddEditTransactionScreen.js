// src/screens/AddEditTransactionScreen.js
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Platform,
  KeyboardAvoidingView, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryPickerModal from '../components/CategoryPickerModal';
import { apiFetch, createTransaction, updateTransaction } from '../services/api';

const FALLBACK_CATS = [
  { id: 1, name: 'Salario' },
  { id: 2, name: 'Renta' },
  { id: 3, name: 'Inversiones' },
  { id: 4, name: 'Comida' },
  { id: 5, name: 'Entretenimiento' },
];

export default function AddEditTransactionScreen({ route, navigation }) {
  const {
    mode = 'add',
    kind = 'income',      // 'income' | 'expense' | 'both'
    id: legacyId,         // legado (editar una sola)
    income: incomeSnap,   // {id, amount, datetime, description, category, categoryName}
    expense: expenseSnap, // idem
  } = route.params || {};
  const isEdit = mode === 'edit';
  const editBoth = kind === 'both';

  // Visibilidad de secciones
  const showIncome  = editBoth ? !!incomeSnap || !!expenseSnap : kind === 'income';
  const showExpense = editBoth ? !!incomeSnap || !!expenseSnap : kind === 'expense';

  // Categorías
  const [categories, setCategories] = useState(FALLBACK_CATS);
  const names = useMemo(() => categories.map(c => c.name), [categories]);
  const nameToId = useMemo(() => {
    const m = new Map(); categories.forEach(c => m.set(c.name, c.id)); return m;
  }, [categories]);
  const idToName = useMemo(() => {
    const m = new Map(); categories.forEach(c => m.set(c.id, c.name)); return m;
  }, [categories]);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch('/categories/');
        if (Array.isArray(list) && list.length) {
          const norm = list.map(x => ({
            id: x.id ?? x.ID ?? x.Id ?? x.id_category ?? x.idCategory ?? x.id,
            name: x.name ?? x.Nombre ?? x.nombre ?? `${x.id}`
          }));
          setCategories(norm);
        }
      } catch {/* fallback */}
    })();
  }, []);

  // Ingreso
  const [incomeId, setIncomeId] = useState(incomeSnap?.id || (legacyId && kind==='income' ? legacyId : null));
  const [incomeCat, setIncomeCat] = useState(incomeSnap?.categoryName || idToName.get(incomeSnap?.category) || names[0] || 'Salario');
  const [incomeAmount, setIncomeAmount] = useState(incomeSnap ? String(incomeSnap.amount ?? '') : '');
  const [incomeDate, setIncomeDate] = useState(incomeSnap?.datetime ? new Date(incomeSnap.datetime) : new Date());
  const [incomeDesc, setIncomeDesc] = useState(incomeSnap?.description || '');

  // Gasto
  const [expenseId, setExpenseId] = useState(expenseSnap?.id || (legacyId && kind==='expense' ? legacyId : null));
  const [expenseCat, setExpenseCat] = useState(expenseSnap?.categoryName || idToName.get(expenseSnap?.category) || names[3] || 'Comida');
  const [expenseAmount, setExpenseAmount] = useState(expenseSnap ? String(expenseSnap.amount ?? '') : '');
  const [expenseDate, setExpenseDate] = useState(expenseSnap?.datetime ? new Date(expenseSnap.datetime) : new Date());
  const [expenseDesc, setExpenseDesc] = useState(expenseSnap?.description || '');

  // Modales
  const [pickerFor, setPickerFor] = useState(null);
  const [showDateFor, setShowDateFor] = useState(null);
  const [saving, setSaving] = useState(false);

  const parseMoney = (s) => {
    const n = parseFloat(String(s).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const saveIncome = async () => {
    const amt = parseMoney(incomeAmount);
    if (amt <= 0) return; // no es obligatorio
    const catId = nameToId.get(incomeCat);
    if (!catId) throw new Error('Selecciona una categoría de ingreso.');
    const payload = {
      amount: +amt,
      datetime: incomeDate.toISOString(),
      description: incomeDesc || '',
      category: catId,
    };
    if (incomeId) await updateTransaction(incomeId, payload);
    else await createTransaction(payload);
  };

  const saveExpense = async () => {
    const amt = parseMoney(expenseAmount);
    if (amt <= 0) return; // no es obligatorio
    const catId = nameToId.get(expenseCat);
    if (!catId) throw new Error('Selecciona una categoría de gasto.');
    const payload = {
      amount: -Math.abs(amt),
      datetime: expenseDate.toISOString(),
      description: expenseDesc || '',
      category: catId,
    };
    if (expenseId) await updateTransaction(expenseId, payload);
    else await createTransaction(payload);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      // Guardamos solo lo que tenga monto válido (>0)
      if (showIncome)  await saveIncome();
      if (showExpense) await saveExpense();

      Alert.alert('OK', isEdit ? 'Cambios guardados' : 'Transacción guardada');
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>LanaApp - Transacciones</Text>
            <Ionicons name="settings-sharp" size={20} color="#cfe" />
          </View>

          <View style={styles.card}>
            {/* INGRESOS */}
            {showIncome && (
              <View>
                <Text style={styles.grayLabel}>Tipo de ingreso:</Text>
                <TouchableOpacity style={[styles.pill, { backgroundColor:'#8AA2FF' }]} onPress={() => setPickerFor('income')}>
                  <Text style={styles.pillText}>{incomeCat}</Text>
                  <MaterialIcons name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>

                <View style={styles.row}>
                  <MaterialIcons name="arrow-upward" size={20} color="#3DBE7A" />
                  <Text style={[styles.blockTitle,{ color:'#3DBE7A'}]}>Ingresos</Text>
                  <View style={{flex:1}}/>
                </View>

                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  value={incomeAmount}
                  onChangeText={setIncomeAmount}
                  keyboardType="numeric"
                  placeholder="$00.00"
                  placeholderTextColor="#bbb"
                  style={styles.input}
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Descripción (opcional)</Text>
                <TextInput
                  value={incomeDesc}
                  onChangeText={setIncomeDesc}
                  placeholder="Ej. Bono, freelance..."
                  placeholderTextColor="#bbb"
                  multiline
                  style={[styles.input, styles.textarea]}
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Fecha</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDateFor('income')}>
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.dateText}>{incomeDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* GASTOS */}
            {showExpense && (
              <View>
                <Text style={[styles.grayLabel, { marginTop: showIncome ? 16 : 0 }]}>Tipo de gasto:</Text>
                <TouchableOpacity style={[styles.pill, { backgroundColor:'#E76E6E' }]} onPress={() => setPickerFor('expense')}>
                  <Text style={styles.pillText}>{expenseCat}</Text>
                  <MaterialIcons name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>

                <View style={styles.row}>
                  <MaterialIcons name="arrow-downward" size={20} color="#E76E6E" />
                  <Text style={[styles.blockTitle,{ color:'#E76E6E'}]}>Gastos</Text>
                  <View style={{flex:1}}/>
                </View>

                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  keyboardType="numeric"
                  placeholder="$00.00"
                  placeholderTextColor="#bbb"
                  style={styles.input}
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Descripción (opcional)</Text>
                <TextInput
                  value={expenseDesc}
                  onChangeText={setExpenseDesc}
                  placeholder="Ej. Comida, Uber..."
                  placeholderTextColor="#bbb"
                  multiline
                  style={[styles.input, styles.textarea]}
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Fecha</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDateFor('expense')}>
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.dateText}>{expenseDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height:16 }} />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: isEdit ? '#F5A524' : '#8AA2FF', opacity: saving ? 0.6 : 1 }]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.primaryText}>{isEdit ? 'Guardar cambios' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryPickerModal
        visible={!!pickerFor}
        title="Categoría:"
        categories={names.length ? names : FALLBACK_CATS.map(c=>c.name)}
        onClose={() => setPickerFor(null)}
        onSelect={(catName) => {
          if (pickerFor === 'income') setIncomeCat(catName);
          else setExpenseCat(catName);
        }}
      />

      {showDateFor && (
        <DateTimePicker
          value={showDateFor === 'income' ? incomeDate : expenseDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            if (d) {
              if (showDateFor === 'income') setIncomeDate(d);
              else setExpenseDate(d);
            }
            setShowDateFor(null);
          }}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header:{ paddingTop:18,paddingHorizontal:14,paddingBottom:8, flexDirection:'row',justifyContent:'space-between',alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },
  card:{ margin:14, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, padding:16, backgroundColor:'rgba(255,255,255,0.06)' },
  grayLabel:{ color:'#cfcfd2', marginBottom:6 },
  pill:{ alignSelf:'flex-start', paddingVertical:6, paddingHorizontal:10, borderRadius:8, flexDirection:'row', alignItems:'center', gap:6 },
  pillText:{ color:'#fff', fontWeight:'700' },
  row:{ flexDirection:'row', alignItems:'center', gap:6, marginTop:8, marginBottom:6 },
  blockTitle:{ fontSize:18, fontWeight:'700' },
  inputLabel:{ color:'#cfcfd2', marginBottom:6, marginTop:4 },
  input:{ backgroundColor:'#eee', borderRadius:8, minHeight:40, paddingHorizontal:10, color:'#222' },
  textarea:{ height:72, paddingTop:10, textAlignVertical:'top' },
  dateBtn:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#3a3a3c', borderRadius:10, paddingVertical:8, paddingHorizontal:12 },
  dateText:{ color:'#fff', fontWeight:'600' },
  primaryBtn:{ alignSelf:'center', paddingVertical:10, paddingHorizontal:22, borderRadius:10 },
  primaryText:{ color:'#fff', fontWeight:'700' },
});
