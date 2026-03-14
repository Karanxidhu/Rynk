import "./global.css"
import 'react-native-gesture-handler'
import { enableScreens } from 'react-native-screens'
import AppNavigator from "./src/navigation/AppNavigator"

enableScreens()
export default function App() {

  return <AppNavigator />

}