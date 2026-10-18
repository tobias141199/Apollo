// Lição 0: os sinais da escrita grega (espíritos, acentos, sigma final, ditongos, iota subscrito,
// γ nasal e pontuação). Texto nosso; a matéria corresponde à Introdução do Athenaze (Part II, p. xii–xvi).
import { FonteTag } from '../components/FonteTag'

const G = ({ children }: { children: string }) => <span className="gr">{children}</span>

export function Sinais() {
  return (
    <section className="sinais">
      <h2>Sinais da escrita</h2>
      <p>Além das letras, o grego usa sinais que fazem parte da grafia: errar um deles é errar a palavra. Os mais importantes são os <b>espíritos</b> e os <b>acentos</b>.</p>

      <div className="bloco-sinal">
        <h3><G>῾ ᾿</G> Espíritos</h3>
        <ol>
          <li><b>Toda palavra que começa por vogal ou ditongo leva um espírito</b> sobre a vogal inicial. Palavras que começam por consoante não levam (com uma exceção: ρ, veja abaixo).</li>
          <li><b>Espírito áspero</b> (<G>῾</G>, aberto para a direita, como um c): a vogal é precedida de um som de <b>h</b> aspirado.
            {' '}<G>ἡμέρα</G> = hēméra, <G>ὁδός</G> = hodós, <G>Ἑλλάς</G> = Hellás. É daí que vem o h de “história” (<G>ἱστορία</G>), “hora” (<G>ὥρα</G>) e “hipódromo” (<G>ἵππος</G>).</li>
          <li><b>Espírito brando</b> (<G>᾿</G>, aberto para a esquerda, como um apóstrofo): não tem som nenhum. <G>ἀγρός</G> = agrós, <G>ἐγώ</G> = egṓ.</li>
          <li><b>Ditongo no começo:</b> o espírito (e o acento) vai sobre a <b>segunda</b> vogal: <G>αὐτός</G>, <G>εἰρήνη</G>, <G>οἶκος</G>, <G>αἷμα</G> (haîma, daí “hemorragia”).</li>
          <li><b>Maiúscula:</b> o espírito se escreve <b>antes</b> da letra, no alto: <G>Ὅμηρος</G> (Homero), <G>Ἀθῆναι</G> (Atenas).</li>
          <li><b>ρ e υ iniciais levam sempre espírito áspero:</b> <G>ῥήτωρ</G> = rhḗtōr (“retórica”), <G>ὕδωρ</G> = hýdōr (“hidráulica”), <G>ὑπό</G> = hypó (“hipótese”).</li>
        </ol>
      </div>

      <div className="bloco-sinal">
        <h3><G>´ ` ῀</G> Acentos</h3>
        <p>Quase toda palavra tem um acento, e ele faz parte da grafia: <G>τίς</G> “quem?” e <G>τις</G> “alguém” são palavras diferentes; <G>ἀλλά</G> é “mas”, <G>ἄλλα</G> é “outras coisas”. No grego antigo o acento marcava a <b>altura</b> da voz (uma melodia), não a força; hoje lemos a sílaba acentuada com mais ênfase.</p>
        <table className="tabela-acentos">
          <thead><tr><th>Acento</th><th>O que indicava</th><th>Onde pode ficar</th><th>Exemplos</th></tr></thead>
          <tbody>
            <tr><td><b>agudo</b> <G>ά</G></td><td>a voz sobe</td><td>numa das <b>três últimas</b> sílabas, sobre vogal breve ou longa</td><td><G>ἄνθρωπος</G>, <G>λόγος</G>, <G>ἀγρός</G></td></tr>
            <tr><td><b>circunflexo</b> <G>ᾶ</G></td><td>a voz sobe e desce na mesma sílaba</td><td>numa das <b>duas últimas</b>, e só sobre <b>vogal longa ou ditongo</b></td><td><G>σῶμα</G>, <G>γῆ</G>, <G>οἶκος</G></td></tr>
            <tr><td><b>grave</b> <G>ὰ</G></td><td>a subida desaparece</td><td>só na <b>última</b> sílaba, no lugar do agudo, quando <b>outra palavra vem logo depois</b></td><td><G>καλὸς ἀγρός</G>, <G>καὶ</G>, <G>τὸν λόγον</G></td></tr>
          </tbody>
        </table>
        <ul>
          <li><b>Agudo que vira grave:</b> <G>καλός</G> sozinho; <G>καλὸς ἀγρός</G> na frase (vem outra palavra depois). Antes de pontuação o agudo volta: <G>ὁ ἀγρὸς καλός.</G></li>
          <li><b>Espírito + acento na mesma vogal:</b> o espírito fica à esquerda do agudo e do grave (<G>ἄ ἅ ἂ ἃ</G>) e embaixo do circunflexo (<G>ἆ ἇ</G>).</li>
          <li><b>Ditongo:</b> o acento também vai sobre a segunda vogal: <G>οἶκος</G>, <G>εἴκοσι</G>.</li>
        </ul>
      </div>

      <div className="bloco-sinal">
        <h3><G>σ ς Σ</G> Sigma: duas formas minúsculas</h3>
        <p>A minúscula do sigma tem duas formas: <G>σ</G> no começo e no meio da palavra, e <G>ς</G> <b>só no fim</b>. Por isso <G>σοφός</G>, <G>στάσις</G>, <G>λόγος</G>, e nunca <G>λόγοσ</G> ou <G>ςοφός</G>. A maiúscula é sempre <G>Σ</G>: <G>Σωκράτης</G>.</p>
      </div>

      <div className="bloco-sinal">
        <h3><G>αι ει οι αυ ευ ου</G> Ditongos e iota subscrito</h3>
        <ul>
          <li><G>αι</G> = ai (“pai”), <G>οι</G> = oi (“boi”), <G>αυ</G> = au (“mau”), <G>ευ</G> = eu (“seu”), <G>υι</G> = üi.</li>
          <li><G>ει</G> soa como um ê longo (ou o “ei” de “lei”); <G>ου</G> soa como u longo: <G>οὐ</G> = “u”.</li>
          <li><b>Iota subscrito:</b> um <G>ι</G> pequeno escrito embaixo de <G>α</G>, <G>η</G> ou <G>ω</G> (<G>ᾳ ῃ ῳ</G>). Era pronunciado no período clássico; hoje não se pronuncia, mas faz parte da grafia. Em maiúsculas, escreve-se ao lado: <G>τῇ κρήνῃ</G> → <G>ΤΗΙ ΚΡΗΝΗΙ</G>.</li>
        </ul>
      </div>

      <div className="bloco-sinal">
        <h3><G>γγ γκ γξ γχ</G> γ nasal</h3>
        <p>Antes de <G>γ</G>, <G>κ</G>, <G>ξ</G> ou <G>χ</G>, o <G>γ</G> soa como o n de “manga”: <G>ἄγγελος</G> = ángelos (“anjo”), <G>ἄγκυρα</G> = ánkyra (“âncora”).</p>
      </div>

      <div className="bloco-sinal">
        <h3><G>. , · ;</G> Pontuação</h3>
        <p>O ponto e a vírgula são como os nossos. O <b>ponto alto</b> (<G>·</G>) vale como dois-pontos ou ponto e vírgula. O <b>;</b> grego é o nosso <b>ponto de interrogação</b>: <G>τίς εἶ;</G> “quem és tu?”.</p>
      </div>
      <FonteTag fonte={{ livro: 'Athenaze', pagina: 'xii–xvi', local: 'Introdução, Part II' }} />
    </section>
  )
}
