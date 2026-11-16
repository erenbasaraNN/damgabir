// QR Model 2, version 5-L, byte mode, mask 0. One Reed–Solomon block.
const SIZE = 37
const DATA = 108
const ECC = 26

function multiply(x: number, y: number) {
  let result = 0
  while (y) {
    if (y & 1) result ^= x
    x = (x << 1) ^ ((x & 128) ? 0x11d : 0)
    y >>>= 1
  }
  return result
}

export function qrPath(value: string) {
  const bytes = new TextEncoder().encode(value)
  if (bytes.length > 106) throw new Error('QR için bağlantı çok uzun.')
  const bits: number[] = []
  function append(value: number, width: number) {
    for (let i = width - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  append(4,4)
  append(bytes.length,8)
  for (const byte of bytes) append(byte,8)
  append(0,4)
  const words: number[] = []
  for (let i = 0; i < bits.length; i += 8) words.push(bits.slice(i,i+8).reduce((n,bit) => (n << 1) | bit,0))
  for (let pad = 0; words.length < DATA; pad++) words.push(pad % 2 ? 0x11 : 0xec)
  let polynomial = [1]
  for (let i = 0, root = 1; i < ECC; i++, root = multiply(root,2)) {
    const next = Array<number>(polynomial.length + 1).fill(0)
    polynomial.forEach((term,j) => {next[j] ^= term; next[j+1] ^= multiply(term,root)})
    polynomial = next
  }
  const remainder = [...words,...Array<number>(ECC).fill(0)]
  for (let i = 0; i < DATA; i++) {
    const factor = remainder[i]
    polynomial.forEach((term,j) => {remainder[i+j] ^= multiply(term,factor)})
  }
  bits.length = 0
  for (const word of [...words,...remainder.slice(DATA)]) append(word,8)
  const grid = Array.from({length:SIZE},() => Array<number>(SIZE).fill(-1))
  const set = (x:number,y:number,v:number) => {if (grid[y]?.[x] !== undefined) grid[y][x] = v}
  for (let i=0;i<SIZE;i++) {set(6,i,1-i%2);set(i,6,1-i%2)}
  for (const [cx,cy] of [[3,3],[SIZE-4,3],[3,SIZE-4],[30,30]]) {
    const radius = cx === 30 && cy === 30 ? 2 : 4
    for(let y=-radius;y<=radius;y++) for(let x=-radius;x<=radius;x++) {
      const d = Math.max(Math.abs(x),Math.abs(y))
      set(cx+x,cy+y,Number(radius === 2 ? d !== 1 : d !== 2 && d !== 4))
    }
  }
  const format = (i:number) => (0x77c4 >>> i) & 1
  for(let i=0;i<6;i++) set(8,i,format(i))
  set(8,7,format(6));set(8,8,format(7));set(7,8,format(8))
  for(let i=9;i<15;i++) set(14-i,8,format(i))
  for(let i=0;i<8;i++) set(SIZE-1-i,8,format(i))
  for(let i=8;i<15;i++) set(8,SIZE-15+i,format(i))
  set(8,SIZE-8,1)
  let bit = 0
  for(let right=SIZE-1;right>=1;right-=2) {
    if(right===6) right--
    for(let row=0;row<SIZE;row++) {
      const y = ((right+1)&2) === 0 ? SIZE-1-row : row
      for(let dx=0;dx<2;dx++) {
        const x = right-dx
        if(grid[y][x] < 0) set(x,y,(bits[bit++] ?? 0) ^ Number((x+y)%2 === 0))
      }
    }
  }
  return grid.flatMap((row,y) => row.map((cell,x) => cell ? `M${x+4} ${y+4}h1v1h-1z` : '')).join('')
}
