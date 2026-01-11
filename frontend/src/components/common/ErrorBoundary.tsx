import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur dans la console
    console.error('ErrorBoundary a capturé une erreur:', error, errorInfo);

    // Mettre à jour l'état avec les détails de l'erreur
    this.setState({
      error,
      errorInfo
    });

    // Ici on pourrait envoyer l'erreur à un service de logging comme Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Icône d'erreur */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              {/* Titre */}
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
                Oups ! Une erreur est survenue
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-center mb-6">
                Nous sommes désolés, mais quelque chose s'est mal passé.
                Notre équipe a été notifiée et travaille sur le problème.
              </p>

              {/* Message d'erreur */}
              {this.state.error && (
                <details className="mb-6 bg-red-50 rounded-lg p-4 border border-red-200">
                  <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                    Détails de l'erreur
                  </summary>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Message :</strong>
                      <pre className="mt-1 p-2 bg-white rounded overflow-auto text-xs">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack trace :</strong>
                        <pre className="mt-1 p-2 bg-white rounded overflow-auto text-xs max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="btn btn-primary flex items-center gap-2 justify-center"
                >
                  <RefreshCw size={20} />
                  Réessayer
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="btn btn-secondary flex items-center gap-2 justify-center"
                >
                  <Home size={20} />
                  Retour à l'accueil
                </button>
              </div>

              {/* Informations supplémentaires */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Si le problème persiste, veuillez contacter le support technique.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
