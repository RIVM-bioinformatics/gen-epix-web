import type {
  Case,
  GeneticSequence,
} from '@gen_epix/api';

export class SequenceUtil {
  public static createFastaContent(sequences: GeneticSequence[], cases: Case[]): string {
    let fastaContent = '';
    cases.forEach((row, index) => {
      const sequence = sequences[index];
      if (sequence) {
        if (fastaContent) {
          fastaContent += '\n';
        }
        fastaContent += `>${row.id}\n${sequence.nucleotide_sequence}\n`;
      }
    });
    return fastaContent;
  }
}
