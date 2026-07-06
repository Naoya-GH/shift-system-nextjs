export default function FlashMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="flash-message">{message}</p>;
}
