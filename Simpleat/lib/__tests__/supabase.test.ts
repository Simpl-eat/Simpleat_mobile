jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

const mockStartAutoRefresh = jest.fn()
const mockStopAutoRefresh = jest.fn()
const mockCreateClient = jest.fn(() => ({
  auth: { startAutoRefresh: mockStartAutoRefresh, stopAutoRefresh: mockStopAutoRefresh },
}))

jest.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))

describe('client Supabase', () => {
  let appStateHandler: (state: string) => void

  beforeAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const { AppState } = require('react-native')
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event: any, handler: any) => {
      appStateHandler = handler
      return { remove: jest.fn() }
    })

    require('../supabase')
  })

  it('persiste la session dans AsyncStorage', () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage')
    const [url, key, options] = mockCreateClient.mock.calls[0] as any[]

    expect(url).toBe('https://test.supabase.co')
    expect(key).toBe('test-anon-key')
    expect(options.auth).toEqual({
      storage: AsyncStorage.default ?? AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    })
  })

  it('démarre le rafraîchissement quand l\'app passe au premier plan', () => {
    appStateHandler('active')
    expect(mockStartAutoRefresh).toHaveBeenCalled()
  })

  it('arrête le rafraîchissement quand l\'app passe en arrière-plan', () => {
    appStateHandler('background')
    expect(mockStopAutoRefresh).toHaveBeenCalled()
  })
})
