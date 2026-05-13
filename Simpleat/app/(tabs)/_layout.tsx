import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';

export const unstable_settings = {
    initialRouteName: 'suggestions',
};

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: '#F7F3EA' },
            }}>
            <Tabs.Screen name="mes-likes" options={{ title: 'Mes likes' }} />
            <Tabs.Screen name="ma-cuisine" options={{ title: 'Ma cuisine' }} />
            <Tabs.Screen name="suggestions" options={{ title: 'Suggestions' }} />
            <Tabs.Screen name="simpl-ia" options={{ title: "Simpl'IA" }} />
            <Tabs.Screen name="profil" options={{ title: 'Mon profil' }} />
            <Tabs.Screen name="home" options={{ href: null }} />
            <Tabs.Screen name="explore" options={{ href: null }} />
            <Tabs.Screen name="(protected)" options={{ href: null }} />
        </Tabs>
    );
}