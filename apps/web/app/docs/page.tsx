import { ENDPOINTS, endpointAnchor } from "@/lib/endpoints";

export const metadata = { title: "API reference | AfrikCompute" };

export default function Docs() {
  return (
    <section className="band">
      <div className="wrap">
        <h1 className="page-title">API reference</h1>
        <p className="lede">
          Send the session token as <code>Authorization: Bearer &lt;token&gt;</code>. Get one by signing in with a NEAR wallet
          (<code>/auth/challenge</code>, then <code>/auth/verify</code>).
        </p>
        <div className="table-scroll">
          <table className="endpoints">
            <thead>
              <tr><th scope="col">Method</th><th scope="col">Path</th><th scope="col">Access</th><th scope="col">What it does</th></tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={endpointAnchor(e)} id={endpointAnchor(e)}>
                  <td><code>{e.method}</code></td>
                  <td><code>{e.path}</code></td>
                  <td>{e.auth}</td>
                  <td>{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
