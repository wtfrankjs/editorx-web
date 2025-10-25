import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0C0C0F] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A22] rounded-2xl p-8 max-w-lg w-full border border-gray-200 dark:border-gray-800 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bir hata oluştu</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-lg font-semibold transition-all"
              >
                Sayfayı Yenile
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-all"
              >
                Önbelleği Temizle ve Yenile
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-500 cursor-pointer hover:text-gray-500 dark:hover:text-gray-400">
                  Teknik Detaylar
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-gray-100 dark:bg-black/50 p-4 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
