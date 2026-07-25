/**
 * DataHubService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Metadata Catalog Engine for EduAudio.
 *
 * Interface with local DataHub instance to fetch educational structural data,
 * document outlines, and accessibility metadata via GraphQL/REST.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Heading } from '../types/teacher.types';

/**
 * Educational metadata structure for a document
 */
export interface EducationalMetadata {
  documentId: string;
  outline: OutlineItem[];
  headings: Heading[];
  accessibility: {
    hasTranscript: boolean;
    hasAltText: boolean;
    isScreenReaderOptimized: boolean;
    isTalkBackOptimized: boolean;
    isVoiceOverOptimized: boolean;
  };
}

/**
 * Item in a document's table of contents or outline
 */
export interface OutlineItem {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
}

const DATAHUB_ENDPOINT = 'http://localhost:9002/api/graphql';

/**
 * DataHubService manages document metadata and structural verification
 */
class DataHubService {
  private static instance: DataHubService;

  private constructor() {}

  /**
   * Singleton instance accessor
   */
  public static getInstance(): DataHubService {
    if (!DataHubService.instance) {
      DataHubService.instance = new DataHubService();
    }
    return DataHubService.instance;
  }

  /**
   * Fetches structured educational metadata via GraphQL/REST.
   * Falls back to mock data if the local DataHub instance is unreachable.
   *
   * @param documentId Unique identifier for the document
   * @returns Promise resolving to EducationalMetadata
   */
  public async fetchMetadata(documentId: string): Promise<EducationalMetadata> {
    console.log(`[DataHubService] Initiating metadata fetch for: ${documentId}`);

    try {
      // GraphQL query to fetch document structure and accessibility info
      const graphqlQuery = {
        query: `
          query GetEducationalMetadata($id: String!) {
            document(id: $id) {
              id
              outline {
                id
                title
                pageNumber
                level
              }
              headings {
                level
                text
                position
              }
              accessibility {
                hasTranscript
                hasAltText
                isScreenReaderOptimized
              }
            }
          }
        `,
        variables: { id: documentId },
      };

      // Attempt to fetch from local DataHub instance
      const response = await fetch(DATAHUB_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
      });

      if (!response.ok) {
        throw new Error(`DataHub responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error('[DataHubService] GraphQL Errors:', result.errors);
        throw new Error('GraphQL query returned errors');
      }

      console.log('[DataHubService] Successfully retrieved metadata from DataHub');
      return result.data.document;

    } catch (error) {
      console.warn(`[DataHubService] DataHub connection failed (${DATAHUB_ENDPOINT}). Falling back to local catalog.`, error);
      return this.getFallbackMetadata(documentId);
    }
  }

  /**
   * Verifies structural context before reading content aloud.
   * Can be used by useAITeacher to confirm if a paragraph aligns with the known outline.
   *
   * @param metadata The metadata catalog for the current document
   * @param pageNumber The page being read
   * @param paragraphText Snippet of text from the paragraph
   * @returns boolean indicating if context is verified
   */
  public verifyStructuralContext(
    metadata: EducationalMetadata,
    pageNumber: number,
    paragraphText: string
  ): boolean {
    console.log(`[DataHubService] Verifying structural context: Page ${pageNumber}`);

    // Check if paragraph aligns with any known headings on this page
    const matchingHeading = metadata.headings.find(h =>
      h.text.toLowerCase().includes(paragraphText.substring(0, 30).toLowerCase())
    );

    if (matchingHeading) {
      console.log(`[DataHubService] Context verified: Text aligns with heading "${matchingHeading.text}"`);
      return true;
    }

    // Verify if the page exists within the structural outline
    const existsInOutline = metadata.outline.some(item => item.pageNumber === pageNumber);

    if (existsInOutline) {
      console.log(`[DataHubService] Context verified: Page ${pageNumber} found in document outline`);
      return true;
    }

    console.warn(`[DataHubService] Structural mismatch: Page ${pageNumber} content could not be verified against outline.`);
    return false;
  }

  /**
   * Generates mock metadata for local development and error recovery
   */
  private getFallbackMetadata(documentId: string): EducationalMetadata {
    return {
      documentId,
      outline: [
        { id: 'toc-1', title: 'Preface', pageNumber: 1, level: 1 },
        { id: 'toc-2', title: 'Chapter 1: Educational Foundations', pageNumber: 5, level: 1 },
        { id: 'toc-3', title: '1.1 Accessibility Standards', pageNumber: 12, level: 2 },
        { id: 'toc-4', title: 'Conclusion', pageNumber: 45, level: 1 },
      ],
      headings: [
        { level: 1, text: 'Preface', position: 0 },
        { level: 1, text: 'Educational Foundations', position: 1000 },
        { level: 2, text: 'Accessibility Standards', position: 2500 },
      ],
      accessibility: {
        hasTranscript: true,
        hasAltText: false,
        isScreenReaderOptimized: true,
        isTalkBackOptimized: true,
        isVoiceOverOptimized: true,
      },
    };
  }
}

// Export singleton instance
export const dataHubService = DataHubService.getInstance();
