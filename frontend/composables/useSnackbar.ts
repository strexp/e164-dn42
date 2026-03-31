export const useSnackbar = () => {
  const snackbar = useState('snackbar', () => ({
    show: false,
    text: '',
    color: 'info' as 'success' | 'error' | 'warning' | 'info',
  }));

  const showSnackbar = (text: string, color: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    snackbar.value = { show: true, text, color };
  };

  return { snackbar, showSnackbar };
}
