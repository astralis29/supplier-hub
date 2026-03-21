export default function DebugPage(props: any) {
  return (
    <pre style={{ padding: 40 }}>
      {JSON.stringify(props, null, 2)}
    </pre>
  )
}