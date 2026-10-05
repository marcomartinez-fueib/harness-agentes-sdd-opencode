import type { Plugin } from "@opencode-ai/plugin"

// Redes de seguridad del arnés. Las ejecuta opencode, no el modelo, así que
// no se pueden "olvidar":
//   1. Tras cada edición, corre los tests y pega el resultado en la salida de
//      la herramienta → el agente lo ve en su siguiente paso.
//   2. Cuando la sesión queda inactiva, ejecuta ./init.sh y avisa si está rojo.
//
// ADÁPTALO A TU STACK: cambia TEST_CMD por pytest, npm test -- --run, etc.
const TEST_CMD = ["python3", "-m", "unittest", "discover", "-s", "tests", "-q"]
const EDIT_TOOLS = new Set(["edit", "write", "patch", "multiedit"])

export const Harness: Plugin = async ({ $, client, directory }) => {
  const tail = (s: string, n: number) => s.trim().split("\n").slice(-n).join("\n")

  return {
    "tool.execute.after": async (input, output) => {
      if (!EDIT_TOOLS.has(input.tool)) return
      const r = await $`${TEST_CMD}`.cwd(directory).nothrow().quiet()
      const log = tail(r.stdout.toString() + r.stderr.toString(), 3)
      output.output += `\n\n[harness] tests tras la edición (exit ${r.exitCode}):\n${log}`
    },

    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      const r = await $`./init.sh`.cwd(directory).nothrow().quiet()
      const ok = r.exitCode === 0
      const message = ok
        ? "[harness] init.sh OK"
        : `[harness] init.sh FALLÓ — ejecuta ./init.sh antes de cerrar\n${tail(r.stdout.toString() + r.stderr.toString(), 10)}`
      await client.app
        .log({ body: { service: "harness", level: ok ? "info" : "warn", message } })
        .catch(() => {})
      await client.tui
        .showToast({ body: { message: ok ? "init.sh OK" : "init.sh FALLÓ", variant: ok ? "success" : "error" } })
        .catch(() => {})
    },
  }
}
