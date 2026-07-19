import { Octokit } from 'octokit';

interface GithubErrorResponse {
  status: number;
  message: string;
}

/**
 * Parses repo string into owner and repo name.
 * e.g., "2507779/dacar16" -> { owner: "2507779", repo: "dacar16" }
 */
function parseRepo(repoString: string): { owner: string; repo: string } {
  const parts = repoString.trim().split('/');
  if (parts.length < 2) {
    throw new Error(`Некорректный формат репозитория: "${repoString}". Ожидается "владелец/репозиторий".`);
  }
  return {
    owner: parts[0],
    repo: parts[1]
  };
}

/**
 * Helper to standardise Octokit error handling.
 */
function handleGithubError(err: any, repoString: string, branch: string): string {
  const status = err.status || err.statusCode;
  const message = err.message || '';

  console.error(`[GitHub Service Error] status=${status}, message=${message}`, err);

  if (status === 401) {
    return 'Ошибка авторизации GitHub (401 Bad credentials). Проверьте правильность токена.';
  }
  if (status === 403) {
    if (message.includes('rate limit')) {
      return 'Превышен лимит запросов GitHub API (403 Rate Limit). Попробуйте позже.';
    }
    return 'Доступ заблокирован (403 Forbidden). Проверьте права токена (Repository permissions -> Contents -> Read & Write).';
  }
  if (status === 404) {
    return `Репозиторий "${repoString}" или ветка "${branch}" не найдены на GitHub. Убедитесь, что репозиторий существует и токен имеет к нему доступ.`;
  }
  if (err.name === 'AbortError' || message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return 'Превышено время ожидания сети при подключении к GitHub API. Попробуйте еще раз.';
  }

  return `Ошибка GitHub API: ${message || 'Неизвестная ошибка'} (Код: ${status || 'NET_ERROR'})`;
}

/**
 * Commits a file to GitHub using Octokit
 */
export async function commitToGithubWithOctokit(
  repoString: string,
  branch: string,
  token: string,
  relativePath: string,
  contentBuffer: Buffer,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { owner, repo } = parseRepo(repoString);
    const octokit = new Octokit({ auth: token });

    // 1. Check if file already exists on GitHub to obtain its SHA
    let sha: string | undefined = undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: relativePath,
        ref: branch,
        request: {
          timeout: 10000 // 10 second timeout for checking
        }
      });

      if (!Array.isArray(data) && data.type === 'file') {
        sha = data.sha;
      }
    } catch (checkErr: any) {
      if (checkErr.status !== 404) {
        // Any error other than 404 means auth / network issues
        const errorText = handleGithubError(checkErr, repoString, branch);
        return { success: false, error: errorText };
      }
      // 404 is expected for newly created files
    }

    // 2. Perform create or update file request
    const contentBase64 = contentBuffer.toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: relativePath,
      message: commitMessage,
      content: contentBase64,
      branch,
      sha,
      request: {
        timeout: 15000 // 15 second timeout for commit
      }
    });

    return { success: true };
  } catch (err: any) {
    const errorText = handleGithubError(err, repoString, branch);
    return { success: false, error: errorText };
  }
}

/**
 * Pulls a file from GitHub using Octokit
 */
export async function pullFromGithubWithOctokit(
  repoString: string,
  branch: string,
  token: string,
  relativePath: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const { owner, repo } = parseRepo(repoString);
    const octokit = new Octokit({ auth: token });

    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: relativePath,
      ref: branch,
      request: {
        timeout: 15000
      }
    });

    if (!Array.isArray(data) && data.type === 'file' && data.content) {
      const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
      return { success: true, content: decodedContent };
    }

    return { success: false, error: 'Запрошенный путь на GitHub не является файлом' };
  } catch (err: any) {
    if (err.status === 404) {
      return { success: false, error: 'Файл не найден на GitHub (404)' };
    }
    const errorText = handleGithubError(err, repoString, branch);
    return { success: false, error: errorText };
  }
}

/**
 * Lists all photos inside public/cars folder in the GitHub repository.
 */
export async function listGithubPhotosWithOctokit(
  token: string,
  repoString: string,
  branch: string
): Promise<{ success: boolean; files: Array<{ name: string; path: string; downloadUrl: string }>; error?: string }> {
  try {
    const { owner, repo } = parseRepo(repoString);
    const octokit = new Octokit({ auth: token });

    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'public/cars',
      ref: branch,
      request: {
        timeout: 15000
      }
    });

    if (Array.isArray(data)) {
      const files = data
        .filter(item => item.type === 'file' && /\.(jpg|jpeg|png|webp|gif)$/i.test(item.name))
        .map(item => ({
          name: item.name,
          path: `/cars/${item.name}`,
          downloadUrl: item.download_url || ''
        }));
      return { success: true, files };
    }

    return { success: true, files: [] };
  } catch (err: any) {
    if (err.status === 404) {
      return { success: true, files: [] };
    }
    const errorText = handleGithubError(err, repoString, branch);
    return { success: false, files: [], error: errorText };
  }
}
