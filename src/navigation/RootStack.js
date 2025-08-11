import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddEditTransactionScreen from '../screens/AddEditTransactionScreen';
import DeleteTransactionScreen from '../screens/DeleteTransactionScreen';

//Placeholders
import CategoriesScreen from '../screens/placeholders/CategoriesScreen';
import FixedPaymentsScreen from '../screens/placeholders/FixedPaymentsScreen';
import AddEditFixedPaymentScreen from '../screens/AddEditFixedPaymentScreen';
import ChartsScreen from '../screens/placeholders/ChartsScreen';
import SetBudgetScreen from '../screens/placeholders/SetBudgetScreen';
import AddIncomeScreen from '../screens/placeholders/AddIncomeScreen';
import AddExpenseScreen from '../screens/placeholders/AddExpenseScreen';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* NUEVO: Transacciones como pantalla principal después del login si quieres */}
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="AddEditTransaction" component={AddEditTransactionScreen} />
        <Stack.Screen name="DeleteTransaction" component={DeleteTransactionScreen} />

        {/* destinos de los botones */}
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="FixedPayments" component={FixedPaymentsScreen} />
        <Stack.Screen name="AddEditFixedPayment" component={AddEditFixedPaymentScreen} />
        <Stack.Screen name="Charts" component={ChartsScreen} />
        <Stack.Screen name="SetBudget" component={SetBudgetScreen} />
        <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
    </Stack.Navigator>
  );
}