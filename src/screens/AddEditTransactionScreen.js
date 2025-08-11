/**
 * AddEditTransactionScreen
 * ------------------------
 * Pantalla para AGREGAR o EDITAR transacciones.
 *
 * Comportamiento:
 *  - Modo 'add':
 *      • Si viene route.params.kind = 'income' -> muestra SOLO sección Ingresos
 *      • Si viene route.params.kind = 'expense' -> muestra SOLO sección Gastos
 *  - Modo 'edit':
 *      • Muestra AMBAS secciones (Ingreso y Gasto) para poder modificar cualquiera.
 *
 * UI:
 *  - Picker de categoría (modal propio).
 *  - Inputs de cantidad, descripción y fecha (DateTimePicker nativo).
 *  - Botón primario "Guardar" o "Guardar cambios" según el modo.
 *  - Scroll + KeyboardAvoidingView para mejor UX con teclado.
 *
 * 🔌 Integración con API (puntos marcados como // API: ...):
 *  1) Cargar categorías reales en el modal:
 *     - GET /categories?type=income y GET /categories?type=expense
 *     - Reemplazar demoIncomeCats/demoExpenseCats por arrays del backend.
 *
 *  2) Pre-cargar datos en modo 'edit':
 *     - Si recibes route.params.id (o un objeto transaction), haz:
 *         GET /transactions/:id
 *       y setea estados (cat, amount, date, description) para income/expense correspondientes.
 *
 *  3) Guardar en onSave():
 *     - Modo 'add':
 *         • Si showIncome  -> POST /transactions  (payload tipo { type:'income', category, amount, date, description })
 *         • Si showExpense -> POST /transactions  (payload tipo { type:'expense', ... })
 *     - Modo 'edit':
 *         • PUT /transactions/:id (o PATCH), con los campos que cambiaron.
 *     - Al éxito: navega hacia atrás y refresca la lista (puedes usar un callback en params o un evento).
 *
 *  4) Validación / formateo:
 *     - Validar que amount sea > 0 y que haya categoría.
 *     - Formatear números a 2 decimales en el payload si tu API lo requiere.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryPickerModal from '../components/CategoryPickerModal';

/** DEMO: categorías mock
 *  API: reemplazar por categorías reales desde el backend.
 *  Sugerencia:
 *    - Mantén dos listas separadas (income/expense) o un array con 'type'.
 *    - Cárgalas en useEffect y pásalas al modal.
 */
const demoIncomeCats  = ['Salario','Renta','Inversiones','Préstamos'];
const demoExpenseCats = ['Comida','Renta','Transporte','Servicios'];

export default function AddEditTransactionScreen({ route, navigation }) {
  const { mode = 'add', kind } = route.params || {};
  const isEdit = mode === 'edit';

  /** En 'add', mostramos solo una sección; en 'edit', mostramos ambas */
  const showIncome  = isEdit || kind === 'income';
  const showExpense = isEdit || kind === 'expense';

  /** Estado: Ingreso */
  const [incomeCat, setIncomeCat]       = useState('Salario');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate]     = useState(new Date());
  const [incomeDesc, setIncomeDesc]     = useState('');

  /** Estado: Gasto */
  const [expenseCat, setExpenseCat]       = useState('Comida');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate]     = useState(new Date());
  const [expenseDesc, setExpenseDesc]     = useState('');

  /** Control de modales (categoría/fecha) */
  const [pickerFor, setPickerFor]   = useState(null); // 'income' | 'expense' | null
  const [showDateFor, setShowDateFor] = useState(null); // 'income' | 'expense' | null

  /** API: si vienes en modo 'edit' con un id, aquí es donde pre-cargas los datos
   *  useEffect(() => {
   *    if (isEdit && route.params?.id) {
   *      // fetch(`${API_URL}/transactions/${route.params.id}`).then(...)
   *      // setIncomeCat(...), setIncomeAmount(...), etc.
   *    }
   *  }, [isEdit, route.params?.id]);
   */

  const onSave = () => {
    // Construir payload para enviar a API
    const data = {
      income: showIncome ? {
        category: incomeCat,
        amount: parseFloat(incomeAmount||'0')||0,
        date: incomeDate,
        description: incomeDesc
      } : null,
      expense: showExpense ? {
        category: expenseCat,
        amount: parseFloat(expenseAmount||'0')||0,
        date: expenseDate,
        description: expenseDesc
      } : null,
    };

    /** API: Guardar
     *  if (!isEdit) {
     *    // ADD
     *    if (data.income)  await POST /transactions { type:'income',  ...data.income }
     *    if (data.expense) await POST /transactions { type:'expense', ...data.expense }
     *  } else {
     *    // EDIT
     *    await PUT /transactions/:id  (incluir campos cambiados)
     *  }
     *  // Al éxito:
     *  // - puedes pasar un callback via route.params.onSaved?.()
     *  // - o disparar un evento de refresco (navigation.emit) y goBack()
     */
    // TODO: enviar a backend/estado global
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex:1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom:24 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>LanaApp - Transacciones</Text>
            <Ionicons name="settings-sharp" size={20} color="#cfe" />
          </View>

          {/* CARD principal */}
          <View style={styles.card}>
            {/* ====== INGRESOS ====== */}
            {showIncome && (
              <View>
                <Text style={styles.grayLabel}>Tipo de ingreso:</Text>

                {/* Selector de categoría
                   API: pasar aquí las categorías reales de ingresos
                 */}
                <TouchableOpacity
                  style={[styles.pill, { backgroundColor:'#8AA2FF' }]}
                  onPress={() => setPickerFor('income')}
                >
                  <Text style={styles.pillText}>{incomeCat}</Text>
                  <MaterialIcons name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>

                <View style={styles.row}>
                  <MaterialIcons name="arrow-upward" size={20} color="#3DBE7A" />
                  <Text style={[styles.blockTitle,{ color:'#3DBE7A'}]}>Ingresos</Text>
                  <View style={{flex:1}}/>
                </View>

                {/* Cantidad */}
                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  value={incomeAmount}
                  onChangeText={setIncomeAmount}
                  keyboardType="numeric"
                  placeholder="$00.00"
                  placeholderTextColor="#bbb"
                  style={styles.input}
                />

                {/* Descripción */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Descripción (opcional)</Text>
                <TextInput
                  value={incomeDesc}
                  onChangeText={setIncomeDesc}
                  placeholder="Ej. Bono, freelance..."
                  placeholderTextColor="#bbb"
                  multiline
                  style={[styles.input, styles.textarea]}
                />

                {/* Fecha */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Fecha</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowDateFor('income')}
                >
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.dateText}>{incomeDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ====== GASTOS ====== */}
            {showExpense && (
              <View>
                <Text style={[styles.grayLabel, { marginTop: showIncome ? 16 : 0 }]}>Tipo de gasto:</Text>

                {/* Selector de categoría
                   API: pasar aquí las categorías reales de gastos
                 */}
                <TouchableOpacity
                  style={[styles.pill, { backgroundColor:'#E76E6E' }]}
                  onPress={() => setPickerFor('expense')}
                >
                  <Text style={styles.pillText}>{expenseCat}</Text>
                  <MaterialIcons name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>

                <View style={styles.row}>
                  <MaterialIcons name="arrow-downward" size={20} color="#E76E6E" />
                  <Text style={[styles.blockTitle,{ color:'#E76E6E'}]}>Gastos</Text>
                  <View style={{flex:1}}/>
                </View>

                {/* Cantidad */}
                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  keyboardType="numeric"
                  placeholder="$00.00"
                  placeholderTextColor="#bbb"
                  style={styles.input}
                />

                {/* Descripción */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Descripción (opcional)</Text>
                <TextInput
                  value={expenseDesc}
                  onChangeText={setExpenseDesc}
                  placeholder="Ej. Comida, Uber..."
                  placeholderTextColor="#bbb"
                  multiline
                  style={[styles.input, styles.textarea]}
                />

                {/* Fecha */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Fecha</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowDateFor('expense')}
                >
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.dateText}>{expenseDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Guardar */}
            <View style={{ height:16 }} />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: isEdit ? '#F5A524' : '#8AA2FF' }]}
              onPress={onSave}
            >
              <Text style={styles.primaryText}>{isEdit ? 'Guardar cambios' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL de categorías
         API: Sustituir 'categories' por las listas cargadas desde el backend.
       */}
      <CategoryPickerModal
        visible={!!pickerFor}
        title="Categoría:"
        categories={pickerFor === 'income' ? demoIncomeCats : demoExpenseCats}
        onClose={() => setPickerFor(null)}
        onSelect={(cat) => {
          if (pickerFor === 'income') setIncomeCat(cat);
          else setExpenseCat(cat);
        }}
      />

      {/* DatePicker nativo */}
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
