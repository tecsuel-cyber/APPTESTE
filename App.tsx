import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { messages, messageForDay } from './src/messages';
import { cancelDaily, scheduleDaily, testNotification } from './src/notifications';

type Tab = 'Hoje' | 'Mensagens' | 'Lembretes';
type Settings = { enabled: boolean; time: string };
const FAVORITES = '@passofirme/favorites';
const SETTINGS = '@passofirme/settings';
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function App() {
  const [tab, setTab] = useState<Tab>('Hoje');
  const [today, setToday] = useState(messageForDay());
  const [selected, setSelected] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [settings, setSettings] = useState<Settings>({ enabled: false, time: '08:00' });
  const [time, setTime] = useState('08:00');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const openNotification = (response: Notifications.NotificationResponse) => {
    const id = response.notification.request.content.data?.messageId;
    if (typeof id === 'string' && messages.some(m => m.id === id)) {
      setSelected(id); setTab('Hoje');
    }
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storedFavorites, storedSettings] = await Promise.all([AsyncStorage.getItem(FAVORITES), AsyncStorage.getItem(SETTINGS)]);
        if (!active) return;
        if (storedFavorites) {
          const parsed: unknown = JSON.parse(storedFavorites);
          if (Array.isArray(parsed)) setFavorites(parsed.filter((id): id is string => typeof id === 'string' && messages.some(m => m.id === id)));
        }
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          if (typeof parsed.enabled === 'boolean' && typeof parsed.time === 'string' && validTime(parsed.time)) {
            setSettings(parsed); setTime(parsed.time);
          }
        }
      } catch { setNotice('Não foi possível carregar suas preferências. Tente abrir o app novamente.'); }
      finally { if (active) setReady(true); }
    })();
    Notifications.getLastNotificationResponseAsync().then(response => { if (active && response) openNotification(response); }).catch(() => {});
    const notification = Notifications.addNotificationResponseReceivedListener(openNotification);
    const app = AppState.addEventListener('change', state => { if (state === 'active') setToday(messageForDay()); });
    const timer = setInterval(() => setToday(messageForDay()), 60000);
    return () => { active = false; notification.remove(); app.remove(); clearInterval(timer); };
  }, []);

  async function toggleFavorite(id: string) {
    if (!ready || busy) return;
    setBusy(true);
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    try { await AsyncStorage.setItem(FAVORITES, JSON.stringify(next)); setFavorites(next); }
    catch { Alert.alert('Não foi possível salvar', 'Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function saveReminders(enabled: boolean) {
    if (!ready || busy) return;
    if (enabled && !validTime(time)) { Alert.alert('Confira o horário', 'Use o formato de 24 horas, por exemplo 08:30.'); return; }
    setBusy(true);
    let changed = false;
    try {
      if (enabled) {
        const [hour, minute] = time.split(':').map(Number);
        await scheduleDaily(hour, minute);
      } else await cancelDaily();
      changed = true;
      const next = { enabled, time: enabled ? time : settings.time };
      await AsyncStorage.setItem(SETTINGS, JSON.stringify(next));
      setSettings(next);
      setNotice(enabled ? `Lembrete diário programado para ${time}.` : 'Lembretes desativados.');
    } catch (error) {
      if (changed) setSettings({ enabled, time: enabled ? time : settings.time });
      Alert.alert('Confira os lembretes', changed ? 'O agendamento foi alterado, mas não foi possível salvar a preferência. Configure novamente ao reabrir o app.' : error instanceof Error ? error.message : 'Tente novamente.');
    } finally { setBusy(false); }
  }
  const current = messages.find(m => m.id === selected) ?? today;
  const visible = onlyFavorites ? messages.filter(m => favorites.includes(m.id)) : messages;
  const button = (label: string, onPress: () => void, secondary = false) => (
    <Pressable accessibilityRole="button" disabled={!ready || busy} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, (!ready || busy || pressed) && { opacity: .55 }]}>
      <Text style={secondary ? styles.secondaryText : styles.buttonText}>{label}</Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}><View style={styles.logo}><Text style={styles.logoText}>↗</Text></View><View><Text style={styles.brand}>PASSO FIRME</Text><Text style={styles.caption}>Um momento para cuidar de você</Text></View></View>
        <Text style={styles.eyebrow}>SEU ESPAÇO DE AUTOCUIDADO</Text>
        <Text style={styles.title}>{tab === 'Hoje' ? 'Você também\nprecisa de cuidado.' : tab === 'Mensagens' ? 'Palavras para\nlevar com você.' : 'Uma pausa\nno seu dia.'}</Text>
        <Text style={styles.subtitle}>Para homens que querem viver com mais equilíbrio, um passo de cada vez.</Text>
        <View style={styles.tabs}>{(['Hoje', 'Mensagens', 'Lembretes'] as Tab[]).map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text></Pressable>)}</View>
        {!ready && <Text style={styles.caption}>Carregando suas preferências…</Text>}
        {notice !== '' && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
        {tab === 'Hoje' && <>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>{selected ? 'PARA REFLETIR' : 'MENSAGEM DO DIA'} · {current.category.toUpperCase()}</Text>
            <Text style={styles.quoteMark}>“</Text><Text style={styles.quote}>{current.text}</Text>
            <View style={styles.divider} /><Text style={styles.actionLabel}>UM PEQUENO PASSO</Text><Text style={styles.body}>{current.action}</Text>
          </View>
          {button(favorites.includes(current.id) ? '♥  Mensagem salva' : '♡  Guardar mensagem', () => { void toggleFavorite(current.id); })}
          {button('Compartilhar mensagem', () => { Share.share({ message: `${current.text}\n\n${current.action}\n— Passo Firme` }).catch(() => Alert.alert('Não foi possível compartilhar')); }, true)}
          {selected && button('Voltar à mensagem do dia', () => setSelected(null), true)}
          <View style={styles.smallCard}><Text style={styles.sectionTitle}>Sem cobrança. Com constância.</Text><Text style={styles.body}>Volte quando precisar de uma pausa. A mensagem do dia muda a cada manhã.</Text></View>
        </>}
        {tab === 'Mensagens' && <>
          <View style={styles.row}><Text style={styles.sectionTitle}>{onlyFavorites ? 'Suas mensagens' : 'Explore no seu ritmo'}</Text><Pressable accessibilityRole="button" onPress={() => setOnlyFavorites(!onlyFavorites)}><Text style={styles.link}>{onlyFavorites ? 'Ver todas' : '♥ Favoritas'}</Text></Pressable></View>
          {visible.length === 0 && <Text style={styles.body}>Você ainda não guardou mensagens. Toque em “Guardar mensagem” para encontrar seus favoritos aqui.</Text>}
          {visible.map(m => <View style={styles.smallCard} key={m.id}><Text style={styles.eyebrow}>{m.category.toUpperCase()}</Text><Text style={styles.messageText}>{m.text}</Text><Text style={styles.body}>{m.action}</Text>{button(favorites.includes(m.id) ? '♥  Salva' : '♡  Guardar mensagem', () => { void toggleFavorite(m.id); }, true)}</View>)}
        </>}
        {tab === 'Lembretes' && <View style={styles.card}>
          <Text style={styles.sectionTitle}>Um encontro com você</Text><Text style={styles.body}>Receba uma mensagem por dia no horário escolhido. São sete mensagens que se repetem a cada semana, sem internet.</Text>
          <View style={styles.row}><Text style={styles.body}>Notificações diárias</Text><Switch accessibilityLabel="Notificações diárias" disabled={!ready || busy} value={settings.enabled} onValueChange={value => { void saveReminders(value); }} trackColor={{ false: '#526760', true: '#9DDFB0' }} thumbColor="#ffffff" /></View>
          <Text style={styles.actionLabel}>HORÁRIO · 24 HORAS</Text><TextInput accessibilityLabel="Horário do lembrete em horas e minutos" style={styles.input} value={time} onChangeText={setTime} placeholder="08:00" placeholderTextColor="#91a99e" maxLength={5} keyboardType="numbers-and-punctuation" editable={ready && !busy} />
          {button(busy ? 'Aguarde…' : 'Salvar e ativar lembrete', () => { void saveReminders(true); })}
          {button('Testar notificação em 5 segundos', () => { setBusy(true); testNotification().then(() => setNotice('Teste agendado. Aguarde cinco segundos.')).catch(error => Alert.alert('Notificação', error instanceof Error ? error.message : 'Falha no teste.')).finally(() => setBusy(false)); }, true)}
          <Text style={styles.caption}>O Android pode atrasar a entrega para economizar bateria. Se necessário, permita as notificações nas configurações do aparelho. Ao viajar entre fusos, salve o horário novamente.</Text>
        </View>}
        <View style={styles.support}><Text style={styles.sectionTitle}>Você pode buscar apoio</Text><Text style={styles.caption}>Este app oferece incentivo e não substitui atendimento psicológico ou médico. No Brasil, o CVV oferece escuta gratuita pelo 188. Em uma emergência, procure atendimento ou ligue 192.</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL('tel:188').catch(() => Alert.alert('CVV', 'Ligue 188 pelo telefone.'))}><Text style={styles.link}>Conversar com o CVV · 188 ↗</Text></Pressable></View>
        <Text style={styles.footer}>PASSO FIRME · CUIDAR DE SI TAMBÉM É FORÇA</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#102621', paddingTop: 30 },
  container: { padding: 24, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#B7E8BA', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 30, color: '#102621' }, brand: { color: '#F0F3E8', fontWeight: '800', letterSpacing: 2, fontSize: 16 },
  caption: { color: '#B5C6BC', fontSize: 13, lineHeight: 21 },
  eyebrow: { color: '#B7E8BA', fontSize: 11, letterSpacing: 1.6, fontWeight: '700' },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '700', color: '#F5F3E6', letterSpacing: -1 },
  subtitle: { color: '#B5C6BC', fontSize: 16, lineHeight: 25 },
  tabs: { flexDirection: 'row', borderRadius: 16, padding: 5, backgroundColor: '#1A332C', marginVertical: 12 },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12 }, activeTab: { backgroundColor: '#B7E8BA' },
  tabText: { color: '#B5C6BC', fontWeight: '600' }, activeTabText: { color: '#102621' },
  card: { backgroundColor: '#203C32', padding: 24, borderRadius: 24, gap: 16, borderColor: '#355344', borderWidth: 1 },
  quoteMark: { color: '#B7E8BA', fontSize: 65, height: 48 }, quote: { color: '#F5F3E6', fontSize: 28, lineHeight: 38, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#42604F', marginVertical: 6 }, actionLabel: { color: '#BED4BF', fontWeight: '700', fontSize: 11, letterSpacing: 1.4 },
  body: { color: '#D4E1D6', fontSize: 15, lineHeight: 24, flexShrink: 1 },
  button: { backgroundColor: '#B7E8BA', padding: 16, borderRadius: 14, alignItems: 'center', minHeight: 50 },
  buttonText: { color: '#102621', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#456152' }, secondaryText: { color: '#CBEBCB', fontWeight: '600', textAlign: 'center' },
  smallCard: { backgroundColor: '#1A332C', padding: 20, borderRadius: 18, gap: 12 },
  sectionTitle: { color: '#F5F3E6', fontWeight: '600', fontSize: 17, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginVertical: 10 },
  link: { color: '#B7E8BA', fontWeight: '600', paddingVertical: 12 },
  messageText: { color: '#F5F3E6', fontSize: 20, lineHeight: 29 },
  input: { color: '#F5F3E6', borderWidth: 1, borderColor: '#698170', borderRadius: 12, padding: 16, fontSize: 24 },
  support: { paddingTop: 24, marginTop: 12, borderTopWidth: 1, borderTopColor: '#355344', gap: 12 },
  footer: { color: '#91A99E', fontSize: 10, letterSpacing: 1.3, textAlign: 'center', marginTop: 12 },
  notice: { color: '#D1EDBC', backgroundColor: '#284333', borderRadius: 12, padding: 14, lineHeight: 21 },
});
